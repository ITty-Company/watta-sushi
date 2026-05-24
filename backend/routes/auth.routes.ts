import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendSms } from '../utils/smsSender';
import { sendPasswordResetEmail } from '../utils/mailer';
import { getJwtSecret } from '../lib/jwtSecret';
import { linkGuestOrdersToUser } from '../lib/linkGuestOrders.js';
import { authenticateUser, AuthRequest } from '../authMiddleware';
import {
  PHONE_ACCOUNTS_LIMIT_MESSAGE,
  cleanPhoneInput,
  countVerifiedUsersByPhone,
  isPhoneVerifiedSlotsFull,
  isValidInternationalPhone,
} from '../lib/phoneAccountLimits.js';

const router = Router();
const prisma = new PrismaClient();

function normalizeEmail(email: string): string {
  return String(email ?? '').trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email));
}

// 1. РЕГИСТРАЦИЯ
router.post('/register', async (req: any, res: any) => {
  const { email, password, name, phone } = req.body;

  try {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidInternationalPhone(phone)) {
      return res.status(400).json({ message: 'Некорректный номер телефона (7–15 цифр)' });
    }
    const cleanPhone = cleanPhoneInput(phone);

    const existingEmailUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingEmailUser && existingEmailUser.isPhoneVerified) {
      return res.status(400).json({ message: 'Этот email уже используется' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let userToUpdate = null;

    if (existingEmailUser && !existingEmailUser.isPhoneVerified) {
      userToUpdate = existingEmailUser;
    }

    const existingPhoneDraft = await prisma.user.findFirst({
      where: { phone: cleanPhone, isPhoneVerified: false },
    });

    if (existingPhoneDraft) {
      if (userToUpdate && userToUpdate.id !== existingPhoneDraft.id) {
        await prisma.user.delete({ where: { id: existingPhoneDraft.id } });
      } else if (!userToUpdate) {
        userToUpdate = existingPhoneDraft;
      }
    }

    const verifiedOnPhone = await countVerifiedUsersByPhone(prisma, cleanPhone, userToUpdate?.id);
    if (isPhoneVerifiedSlotsFull(verifiedOnPhone)) {
      return res.status(400).json({ message: PHONE_ACCOUNTS_LIMIT_MESSAGE });
    }

    let savedUser;

    if (userToUpdate) {
      savedUser = await prisma.user.update({
        where: { id: userToUpdate.id },
        data: {
          email: normalizedEmail,
          phone: cleanPhone,
          password: hashedPassword,
          name,
          isPhoneVerified: true,
          verificationCode: null,
          pendingPhone: null,
        },
      });
    } else {
      savedUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name,
          phone: cleanPhone,
          isPhoneVerified: true,
        },
      });
    }

    await linkGuestOrdersToUser(prisma, savedUser.id, savedUser.phone);

    res.status(201).json(issueAuthToken(savedUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// 2. ПОДТВЕРЖДЕНИЕ КОДА
router.post('/verify', async (req: any, res: any) => {
  const { phone, code, email } = req.body;

  try {
    if (!phone) return res.status(400).json({ message: 'Не указан телефон' });
    if (!isValidInternationalPhone(phone)) {
      return res.status(400).json({ message: 'Некорректный номер телефона (7–15 цифр)' });
    }

    const cleanPhone = cleanPhoneInput(phone);
    const normalizedEmail = email ? normalizeEmail(email) : null;
    const codeStr = String(code ?? '');

    let user =
      normalizedEmail != null
        ? await prisma.user.findUnique({ where: { email: normalizedEmail } })
        : null;

    if (user && user.phone !== cleanPhone) {
      user = null;
    }

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          phone: cleanPhone,
          verificationCode: codeStr,
        },
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'Пользователь с таким телефоном не найден' });
    }

    if (user.isPhoneVerified) {
      await linkGuestOrdersToUser(prisma, user.id, user.phone);
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        getJwtSecret(),
        { expiresIn: '30d' },
      );
      return res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    }

    if (user.verificationCode !== codeStr) {
      return res.status(400).json({ message: 'Неверный код' });
    }

    const verifiedOnPhone = await countVerifiedUsersByPhone(prisma, cleanPhone, user.id);
    if (isPhoneVerifiedSlotsFull(verifiedOnPhone)) {
      return res.status(400).json({ message: PHONE_ACCOUNTS_LIMIT_MESSAGE });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isPhoneVerified: true, verificationCode: null },
    });

    await linkGuestOrdersToUser(prisma, updatedUser.id, updatedUser.phone);

    const token = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      getJwtSecret(),
      { expiresIn: '30d' },
    );

    res.json({
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Ошибка верификации:', error);
    res.status(500).json({ message: 'Ошибка сервера при подтверждении' });
  }
});

function serializeAuthUser(user: {
  id: number;
  email: string;
  name: string | null;
  phone: string;
  role: string;
  isPhoneVerified: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: formatPhoneOut(user.phone),
    role: user.role,
    isPhoneVerified: user.isPhoneVerified,
  };
}

function issueAuthToken(user: {
  id: number;
  email: string;
  name: string | null;
  phone: string;
  role: string;
  isPhoneVerified: boolean;
}) {
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '30d' },
  );
  return {
    token,
    user: serializeAuthUser(user),
  };
}

// Восстановление пароля: код на email
router.post('/forgot-password', async (req: any, res: any) => {
  const { email } = req.body;

  try {
    if (!email) return res.status(400).json({ message: 'Укажите email' });
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Некорректный email' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь с таким email не найден' });
    }

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: resetCode },
    });

    try {
      await sendPasswordResetEmail(normalizedEmail, resetCode);
    } catch (mailError) {
      console.error('Ошибка отправки email:', mailError);
      console.log('>>> КОД ВОССТАНОВЛЕНИЯ ПАРОЛЯ (email):', resetCode, 'для', normalizedEmail, '<<<');
    }

    res.json({ message: 'Код восстановления отправлен на email' });
  } catch (error) {
    console.error('Ошибка forgot-password:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Восстановление пароля: проверка кода, смена пароля и автоматический вход
router.post('/reset-password', async (req: any, res: any) => {
  const { email, code, password } = req.body;

  try {
    if (!email || !code || !password) {
      return res.status(400).json({ message: 'Заполните email, код и новый пароль' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Некорректный email' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь с таким email не найден' });
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
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(400).json({ message: 'Неверный email или пароль' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Неверный email или пароль' });

    await linkGuestOrdersToUser(prisma, user.id, user.phone);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '30d' },
    );

    res.json({
      token,
      user: serializeAuthUser(user),
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
  isPhoneVerified: true,
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
  isPhoneVerified: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? '',
    phone: formatPhoneOut(user.phone),
    role: user.role,
    bonusBalance: user.bonusBalance,
    address: user.address ?? '',
    isPhoneVerified: user.isPhoneVerified,
  };
}

async function clearUnverifiedPhoneConflict(cleanPhone: string, keepUserId: number) {
  const conflicts = await prisma.user.findMany({
    where: {
      phone: cleanPhone,
      id: { not: keepUserId },
      isPhoneVerified: false,
    },
  });
  for (const row of conflicts) {
    await prisma.user.delete({ where: { id: row.id } });
  }
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
    if (!isValidInternationalPhone(phone)) {
      return res.status(400).json({ message: 'Некорректный номер телефона (7–15 цифр)' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (user.phone === cleanPhone && user.isPhoneVerified) {
      return res.status(400).json({ message: 'Этот номер уже привязан к аккаунту' });
    }

    const verifiedOnTarget = await countVerifiedUsersByPhone(prisma, cleanPhone, user.id);
    if (isPhoneVerifiedSlotsFull(verifiedOnTarget)) {
      return res.status(400).json({ message: PHONE_ACCOUNTS_LIMIT_MESSAGE });
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

    const verifiedOnTarget = await countVerifiedUsersByPhone(prisma, cleanPhone, user.id);
    if (isPhoneVerifiedSlotsFull(verifiedOnTarget)) {
      return res.status(400).json({ message: PHONE_ACCOUNTS_LIMIT_MESSAGE });
    }

    await clearUnverifiedPhoneConflict(cleanPhone, user.id);

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
