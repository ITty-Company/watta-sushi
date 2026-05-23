import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendSms } from '../utils/smsSender';
import { getJwtSecret } from '../lib/jwtSecret';
import { linkGuestOrdersToUser } from '../lib/linkGuestOrders.js';
import { authenticateUser, AuthRequest } from '../authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// 1. РЕГИСТРАЦИЯ
router.post('/register', async (req: any, res: any) => {
  const { email, password, name, phone } = req.body;

  try {
    const cleanPhone = phone.replace(/\D/g, ''); 

    // 1. Ищем, есть ли уже записи с таким Email или Телефоном
    const existingEmailUser = await prisma.user.findUnique({ where: { email } });
    const existingPhoneUser = await prisma.user.findUnique({ where: { phone: cleanPhone } });

    // 2. Если есть ПОДТВЕРЖДЕННЫЙ пользователь с таким Email — ошибка
    if (existingEmailUser && existingEmailUser.isPhoneVerified) {
      return res.status(400).json({ message: 'Этот email уже используется' });
    }

    // 3. Если есть ПОДТВЕРЖДЕННЫЙ пользователь с таким Телефоном — ошибка
    if (existingPhoneUser && existingPhoneUser.isPhoneVerified) {
      return res.status(400).json({ message: 'Этот номер телефона уже зарегистрирован' });
    }

    // Подготовка данных
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Логика обработки "черновиков" (неподтвержденных пользователей)
    let userToUpdate = null;

    // Если нашли неподтвержденного по email
    if (existingEmailUser && !existingEmailUser.isPhoneVerified) {
        userToUpdate = existingEmailUser;
    }
    
    // Если нашли неподтвержденного по телефону
    if (existingPhoneUser && !existingPhoneUser.isPhoneVerified) {
        // Сценарий конфликта: нашли двух разных неподтвержденных (одного по email, другого по phone)
        if (userToUpdate && userToUpdate.id !== existingPhoneUser.id) {
             // Удаляем того, кого нашли по телефону, чтобы освободить номер для обновления основного аккаунта
             await prisma.user.delete({ where: { id: existingPhoneUser.id } });
        } else if (!userToUpdate) {
             // Если по email никого не нашли, берем этого пользователя для обновления
             userToUpdate = existingPhoneUser;
        }
    }

    if (userToUpdate) {
        // ОБНОВЛЯЕМ существующую неподтвержденную запись
        // Это позволяет "перезапустить" регистрацию для того же email/телефона
        await prisma.user.update({
            where: { id: userToUpdate.id },
            data: {
                email, 
                phone: cleanPhone, 
                password: hashedPassword,
                name,
                verificationCode,
                // isPhoneVerified оставляем false (или можно явно указать false)
            }
        });
    } else {
        // СОЗДАЕМ новую запись, если совпадений не найдено
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone: cleanPhone,
                verificationCode,
                isPhoneVerified: false 
            },
        });
    }

    // Отправка СМС
    try {
      await sendSms(phone, `Код подтверждения Watta Sushi: ${verificationCode}`);
    } catch (smsError) {
      console.error('Ошибка отправки СМС:', smsError);
      console.log('>>> КОД ПОДТВЕРЖДЕНИЯ:', verificationCode, '<<<');
    }

    res.status(201).json({ message: 'Код подтверждения отправлен' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// 2. ПОДТВЕРЖДЕНИЕ КОДА (ИСПРАВЛЕНО: Ищем по телефону)
router.post('/verify', async (req: any, res: any) => {
  // БЫЛО: const { email, code } = req.body;
  // СТАЛО: Берем телефон, так как код пришел на телефон
  const { phone, code } = req.body; 

  try {
    if (!phone) return res.status(400).json({ message: 'Не указан телефон' });

    // Очищаем телефон так же, как при регистрации
    const cleanPhone = phone.replace(/\D/g, '');

    // Ищем пользователя по ТЕЛЕФОНУ
    const user = await prisma.user.findUnique({ where: { phone: cleanPhone } });

    if (!user) return res.status(404).json({ message: 'Пользователь с таким телефоном не найден' });
    
    // Если уже подтвержден - просто отдаем токен (чтобы не было ошибки)
    if (user.isPhoneVerified) {
        await linkGuestOrdersToUser(prisma, user.id, user.phone);
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '30d' });
        return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }

    // Проверка кода
    if (user.verificationCode !== code) {
        // Для тестов можно оставить лазейку, если код '1111'
        // if (code !== '1111' && user.verificationCode !== code) ...
        return res.status(400).json({ message: 'Неверный код' });
    }

    // Обновляем статус
    const updatedUser = await prisma.user.update({
      where: { id: user.id }, // Надежнее обновлять по ID
      data: { isPhoneVerified: true, verificationCode: null }
    });

    await linkGuestOrdersToUser(prisma, updatedUser.id, updatedUser.phone);

    // Генерируем токен
    const token = jwt.sign(
        { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role }, 
        getJwtSecret(), 
        { expiresIn: '30d' }
    );

    // Возвращаем данные. Фронтенд ждет user.id!
    res.json({ 
        token, 
        user: { 
            id: updatedUser.id, 
            email: updatedUser.email, 
            name: updatedUser.name, 
            phone: updatedUser.phone,
            role: updatedUser.role 
        } 
    });

  } catch (error) {
    console.error('Ошибка верификации:', error);
    res.status(500).json({ message: 'Ошибка сервера при подтверждении' });
  }
});

function cleanPhoneInput(phone: string): string {
  return phone.replace(/\D/g, '');
}

function issueAuthToken(user: { id: number; email: string; name: string | null; role: string }) {
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '30d' },
  );
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

// Восстановление пароля: отправка SMS-кода на подтверждённый номер
router.post('/forgot-password', async (req: any, res: any) => {
  const { phone } = req.body;

  try {
    if (!phone) return res.status(400).json({ message: 'Не указан телефон' });

    const cleanPhone = cleanPhoneInput(phone);
    const user = await prisma.user.findUnique({ where: { phone: cleanPhone } });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь с таким номером не найден' });
    }
    if (!user.isPhoneVerified) {
      return res.status(403).json({ message: 'Номер телефона не подтверждён. Завершите регистрацию.' });
    }

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: resetCode },
    });

    const smsPhone = phone.startsWith('+') ? phone : `+${cleanPhone}`;
    try {
      await sendSms(smsPhone, `Код восстановления пароля Watta Sushi: ${resetCode}`);
    } catch (smsError) {
      console.error('Ошибка отправки СМС:', smsError);
      console.log('>>> КОД ВОССТАНОВЛЕНИЯ ПАРОЛЯ:', resetCode, '<<<');
    }

    res.json({ message: 'Код восстановления отправлен' });
  } catch (error) {
    console.error('Ошибка forgot-password:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Восстановление пароля: проверка кода, смена пароля и автоматический вход
router.post('/reset-password', async (req: any, res: any) => {
  const { phone, code, password } = req.body;

  try {
    if (!phone || !code || !password) {
      return res.status(400).json({ message: 'Заполните телефон, код и новый пароль' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
    }

    const cleanPhone = cleanPhoneInput(phone);
    const user = await prisma.user.findUnique({ where: { phone: cleanPhone } });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь с таким номером не найден' });
    }
    if (!user.isPhoneVerified) {
      return res.status(403).json({ message: 'Номер телефона не подтверждён' });
    }
    if (!user.verificationCode || user.verificationCode !== String(code)) {
      return res.status(400).json({ message: 'Неверный код' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, verificationCode: null },
    });

    await linkGuestOrdersToUser(prisma, updatedUser.id, updatedUser.phone);

    res.json(issueAuthToken(updatedUser));
  } catch (error) {
    console.error('Ошибка reset-password:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Неверный email или пароль' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Неверный email или пароль' });

    if (!user.isPhoneVerified) {
        return res.status(403).json({ message: 'Номер телефона не подтвержден.' });
    }

    await linkGuestOrdersToUser(prisma, user.id, user.phone);

    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role }, 
        getJwtSecret(), 
        { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: formatPhoneOut(user.phone),
        role: user.role,
      },
    });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка входа' });
  }
});

const profileUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  bonusBalance: true,
  address: true,
} as const;

function formatPhoneOut(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

function serializeProfileUser(user: {
  id: number;
  email: string;
  name: string | null;
  phone: string;
  role: string;
  bonusBalance: number;
  address: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? '',
    phone: formatPhoneOut(user.phone),
    role: user.role,
    bonusBalance: user.bonusBalance,
    address: user.address ?? '',
  };
}

async function clearUnverifiedPhoneConflict(cleanPhone: string, keepUserId: number) {
  const existing = await prisma.user.findUnique({ where: { phone: cleanPhone } });
  if (!existing || existing.id === keepUserId) return;
  if (existing.isPhoneVerified) {
    throw new Error('PHONE_TAKEN');
  }
  await prisma.user.delete({ where: { id: existing.id } });
}

// Профіль: поточний користувач
router.get('/me', authenticateUser, async (req: AuthRequest, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: profileUserSelect,
    });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json({ user: serializeProfileUser(user) });
  } catch (error) {
    console.error('Ошибка GET /auth/me:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Профіль: ім'я та адреса (телефон — окремим потоком з SMS)
router.patch('/profile', authenticateUser, async (req: AuthRequest, res: any) => {
  const { name, address, phone } = req.body ?? {};

  if (phone !== undefined) {
    return res.status(400).json({
      message: 'Для смены телефона подтвердите номер кодом из SMS',
    });
  }

  try {
    const data: { name?: string; address?: string } = {};

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({ message: 'Укажите имя' });
      }
      if (trimmed.length > 120) {
        return res.status(400).json({ message: 'Имя слишком длинное' });
      }
      data.name = trimmed;
    }

    if (address !== undefined) {
      const trimmed = String(address).trim();
      if (trimmed.length > 500) {
        return res.status(400).json({ message: 'Адрес слишком длинный' });
      }
      data.address = trimmed;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'Нет данных для сохранения' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: profileUserSelect,
    });

    res.json({ user: serializeProfileUser(updated) });
  } catch (error) {
    console.error('Ошибка PATCH /auth/profile:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Зміна телефону: надіслати SMS на новий номер
router.post('/profile/phone/send-code', authenticateUser, async (req: AuthRequest, res: any) => {
  const { phone } = req.body ?? {};

  try {
    if (!phone) {
      return res.status(400).json({ message: 'Не указан телефон' });
    }

    const cleanPhone = cleanPhoneInput(phone);
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return res.status(400).json({ message: 'Некорректный номер телефона' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (user.phone === cleanPhone) {
      return res.status(400).json({ message: 'Этот номер уже привязан к аккаунту' });
    }

    const taken = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (taken && taken.id !== user.id && taken.isPhoneVerified) {
      return res.status(400).json({ message: 'Этот номер телефона уже зарегистрирован' });
    }

    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: { pendingPhone: cleanPhone, verificationCode },
    });

    const smsPhone = formatPhoneOut(cleanPhone);
    try {
      await sendSms(smsPhone, `Код подтверждения Watta Sushi: ${verificationCode}`);
    } catch (smsError) {
      console.error('Ошибка отправки СМС:', smsError);
      console.log('>>> КОД СМЕНЫ ТЕЛЕФОНА:', verificationCode, '<<<');
    }

    res.json({ message: 'Код подтверждения отправлен' });
  } catch (error) {
    console.error('Ошибка profile/phone/send-code:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Зміна телефону: підтвердити код і застосувати номер
router.post('/profile/phone/verify', authenticateUser, async (req: AuthRequest, res: any) => {
  const { phone, code } = req.body ?? {};

  try {
    if (!phone || !code) {
      return res.status(400).json({ message: 'Укажите телефон и код' });
    }

    const cleanPhone = cleanPhoneInput(phone);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (!user.pendingPhone || user.pendingPhone !== cleanPhone) {
      return res.status(400).json({ message: 'Запросите новый код для этого номера' });
    }

    if (!user.verificationCode || user.verificationCode !== String(code)) {
      return res.status(400).json({ message: 'Неверный код' });
    }

    try {
      await clearUnverifiedPhoneConflict(cleanPhone, user.id);
    } catch (e) {
      if (e instanceof Error && e.message === 'PHONE_TAKEN') {
        return res.status(400).json({ message: 'Этот номер телефона уже зарегистрирован' });
      }
      throw e;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: cleanPhone,
        pendingPhone: null,
        verificationCode: null,
        isPhoneVerified: true,
      },
      select: profileUserSelect,
    });

    await linkGuestOrdersToUser(prisma, updated.id, updated.phone);

    res.json({ user: serializeProfileUser(updated), message: 'Номер телефона обновлён' });
  } catch (error) {
    console.error('Ошибка profile/phone/verify:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;