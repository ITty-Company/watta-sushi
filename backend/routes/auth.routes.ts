import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendSms } from '../utils/smsSender';
import { sendPasswordResetEmail } from '../utils/mailer';
import { getJwtSecret } from '../lib/jwtSecret';
import { linkGuestOrdersToUser } from '../lib/linkGuestOrders.js';
import { authenticateUser, AuthRequest } from '../authMiddleware';
import { authRateLimiter, sendCodeRateLimiter, verifyCodeRateLimiter } from '../rateLimiter';
import { randomInt, randomBytes } from 'crypto';
import {
  PHONE_ACCOUNTS_LIMIT_MESSAGE,
  cleanPhoneInput,
  countVerifiedUsersByPhone,
  isPhoneVerifiedSlotsFull,
  isValidInternationalPhone,
} from '../lib/phoneAccountLimits.js';
import { syncUserAdminRole } from '../lib/adminPhones.js';
import {
  saveUserAddressIfNew,
  serializeUserAddress,
  syncUserPrimaryAddress,
} from '../lib/userAddressBook.js';
import { verifyGoogleIdToken } from '../lib/googleOAuth.js';

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
router.post('/register', authRateLimiter, async (req: any, res: any) => {
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

    res.status(201).json(await issueAuthToken(savedUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// 2. ПОДТВЕРЖДЕНИЕ КОДА
router.post('/verify', verifyCodeRateLimiter, async (req: any, res: any) => {
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
      return res.json(await issueAuthToken(user));
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

    res.json(await issueAuthToken(updatedUser));
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

async function issueAuthToken(user: {
  id: number;
  email: string;
  name: string | null;
  phone: string;
  role: string;
  isPhoneVerified: boolean;
}) {
  const role = await syncUserAdminRole(prisma, user.id);
  const syncedUser = { ...user, role };
  const token = jwt.sign(
    { userId: syncedUser.id, email: syncedUser.email, role: syncedUser.role },
    getJwtSecret(),
    { expiresIn: '30d' },
  );
  return {
    token,
    user: serializeAuthUser(syncedUser),
  };
}

function phonePlaceholderEmail(cleanPhone: string): string {
  return `p${cleanPhone}@phone.wattasushi.local`;
}

async function sendAuthVerificationSms(cleanPhone: string, code: string) {
  const smsPhone = formatPhoneOut(cleanPhone);
  try {
    await sendSms(smsPhone, `Код подтверждения Watta Sushi: ${code}`);
  } catch (smsError) {
    console.error('Ошибка отправки СМС:', smsError);
    if (process.env.NODE_ENV !== 'production') {
      console.log('>>> AUTH SMS CODE:', code, 'для', smsPhone, '<<<');
      return;
    }
    throw smsError;
  }
}

/** Вхід: SMS-код на підтверджений номер */
router.post('/login/send-code', sendCodeRateLimiter, async (req: any, res: any) => {
  const { phone } = req.body ?? {};
  try {
    if (!isValidInternationalPhone(phone)) {
      return res.status(400).json({ message: 'Некорректный номер телефона (7–15 цифр)' });
    }
    const cleanPhone = cleanPhoneInput(phone);
    const user = await prisma.user.findFirst({
      where: { phone: cleanPhone, isPhoneVerified: true },
    });
    if (!user) {
      return res.status(404).json({
        message: 'Користувача з таким номером не знайдено. Зареєструйтесь або перевірте номер.',
      });
    }
    const code = String(randomInt(1000, 10000));
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: code },
    });
    await sendAuthVerificationSms(cleanPhone, code);
    res.json({ ok: true });
  } catch (error) {
    console.error('login/send-code:', error);
    res.status(500).json({ message: 'Не вдалося надіслати код' });
  }
});

/** Реєстрація: чернетка + SMS-код */
router.post('/register/send-code', sendCodeRateLimiter, async (req: any, res: any) => {
  const { name, phone } = req.body ?? {};
  try {
    const trimmedName = String(name ?? '').trim();
    if (!trimmedName) {
      return res.status(400).json({ message: 'Вкажіть ім\'я' });
    }
    if (!isValidInternationalPhone(phone)) {
      return res.status(400).json({ message: 'Некорректный номер телефона (7–15 цифр)' });
    }
    const cleanPhone = cleanPhoneInput(phone);
    const placeholderEmail = phonePlaceholderEmail(cleanPhone);

    const verifiedOnPhone = await countVerifiedUsersByPhone(prisma, cleanPhone);
    if (isPhoneVerifiedSlotsFull(verifiedOnPhone)) {
      return res.status(400).json({ message: PHONE_ACCOUNTS_LIMIT_MESSAGE });
    }

    const verifiedExisting = await prisma.user.findFirst({
      where: { phone: cleanPhone, isPhoneVerified: true },
    });
    if (verifiedExisting) {
      return res.status(400).json({
        message: 'Цей номер уже зареєстровано. Увійдіть за номером телефону.',
      });
    }

    const code = String(randomInt(1000, 10000));
    const hashedPassword = await bcrypt.hash(randomBytes(24).toString('hex'), 10);

    let draft =
      (await prisma.user.findFirst({
        where: { phone: cleanPhone, isPhoneVerified: false },
      })) ??
      (await prisma.user.findUnique({ where: { email: placeholderEmail } }));

    if (draft?.isPhoneVerified) {
      return res.status(400).json({ message: 'Цей номер уже зареєстровано.' });
    }

    if (draft) {
      draft = await prisma.user.update({
        where: { id: draft.id },
        data: {
          name: trimmedName,
          phone: cleanPhone,
          email: placeholderEmail,
          password: hashedPassword,
          verificationCode: code,
          isPhoneVerified: false,
          pendingPhone: null,
        },
      });
    } else {
      draft = await prisma.user.create({
        data: {
          email: placeholderEmail,
          password: hashedPassword,
          name: trimmedName,
          phone: cleanPhone,
          isPhoneVerified: false,
          verificationCode: code,
        },
      });
    }

    await sendAuthVerificationSms(cleanPhone, code);
    res.json({ ok: true });
  } catch (error) {
    console.error('register/send-code:', error);
    res.status(500).json({ message: 'Не вдалося надіслати код' });
  }
});

// Восстановление пароля: код на email
router.post('/forgot-password', sendCodeRateLimiter, async (req: any, res: any) => {
  const { email } = req.body;

  try {
    if (!email) return res.status(400).json({ message: 'Укажите email' });
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Некорректный email' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Всегда 200, защита от email enumeration
    if (!user) {
      return res.status(200).json({ message: 'Если такой пользователь существует, мы отправили код на его email.' });
    }

    const resetCode = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: resetCode,
        verificationCodeExpiresAt: expiresAt,
      },
    });

    try {
      await sendPasswordResetEmail(normalizedEmail, resetCode);
      return res.status(200).json({ message: 'Код отправлен на ваш email.' });
    } catch (err) {
      console.error('Ошибка отправки:', err);
      return res.status(500).json({ message: 'Ошибка при отправке письма' });
    }
  } catch (error) {
    console.error('Ошибка forgot-password:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Восстановление пароля: проверка кода, смена пароля
router.post('/reset-password', verifyCodeRateLimiter, async (req: any, res: any) => {
  const { email, code, password } = req.body;
  try {
    if (!email || !code || !password) {
      return res.status(400).json({ message: 'Заполните email, код и новый пароль' });
    }
    
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверка кода
    if (user.verificationCode !== String(code)) {
      return res.status(400).json({ message: 'Неверный код' });
    }
    
    // Проверка времени (используем Optional Chaining, так как поле может быть null)
    if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Код истёк. Запросите новый.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, verificationCode: null, verificationCodeExpiresAt: null },
    });

    await linkGuestOrdersToUser(prisma, updatedUser.id, updatedUser.phone);

    res.json(await issueAuthToken(updatedUser));
  } catch (error) {
    console.error('Ошибка reset-password:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/login', authRateLimiter, async (req: any, res: any) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(400).json({ message: 'Неверный email или пароль' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Неверный email или пароль' });

    await linkGuestOrdersToUser(prisma, user.id, user.phone);

    res.json(await issueAuthToken(user));
  } catch (e) {
    console.error('LOGIN ERROR:', e);

    res.status(500).json({
      message: 'Ошибка входа'
    });
  }
});

/** Вхід / реєстрація через Google (ID token з GIS) */
router.post('/google', authRateLimiter, async (req: any, res: any) => {
  const { idToken } = req.body ?? {};
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ message: 'Не вдалося увійти через Google' });
  }

  try {
    const profile = await verifyGoogleIdToken(idToken);

    let isNewUser = false;

    let user =
      (await prisma.user.findUnique({ where: { googleId: profile.googleId } })) ??
      (await prisma.user.findUnique({ where: { email: profile.email } }));

    if (user) {
      if (user.googleId && user.googleId !== profile.googleId) {
        return res.status(400).json({
          message: 'Цей email уже прив\'язаний до іншого Google-акаунта',
        });
      }
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: profile.googleId,
            name: user.name?.trim() ? user.name : profile.name,
          },
        });
      }
    } else {
      isNewUser = true;
      const hashedPassword = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
      user = await prisma.user.create({
        data: {
          email: profile.email,
          password: hashedPassword,
          name: profile.name,
          phone: '',
          googleId: profile.googleId,
          isPhoneVerified: false,
        },
      });
    }

    if (user.isPhoneVerified && user.phone) {
      await linkGuestOrdersToUser(prisma, user.id, user.phone);
    }

    res.json({ ...(await issueAuthToken(user)), isNewUser });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'GOOGLE_OAUTH_NOT_CONFIGURED') {
      return res.status(503).json({ message: 'Вхід через Google тимчасово недоступний' });
    }
    if (code === 'GOOGLE_EMAIL_NOT_VERIFIED') {
      return res.status(400).json({ message: 'Підтвердіть email у Google і спробуйте знову' });
    }
    console.error('auth/google:', error);
    return res.status(401).json({ message: 'Не вдалося увійти через Google' });
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
    const role = await syncUserAdminRole(prisma, user.id);
    res.json({ user: serializeProfileUser({ ...user, role }) });
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

    const userId = req.user!.id;
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: profileUserSelect,
    });

    if (address !== undefined) {
      const trimmed = String(address).trim();
      if (trimmed) {
        const existing = await prisma.userAddress.findFirst({
          where: { userId, address: trimmed },
        });
        if (!existing) {
          await prisma.userAddress.create({
            data: { userId, address: trimmed },
          });
        }
      }
    }

    res.json({ user: serializeProfileUser(updated) });
  } catch (error) {
    console.error('Ошибка PATCH /auth/profile:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Зміна телефону: надіслати SMS на новий номер
router.post('/profile/phone/send-code',sendCodeRateLimiter, authenticateUser, async (req: AuthRequest, res: any) => {
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

    const role = await syncUserAdminRole(prisma, updated.id);
    res.json({ user: serializeProfileUser({ ...updated, role }), message: 'Номер телефона обновлён' });
  } catch (error) {
    console.error('Ошибка profile/phone/verify:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Збережені адреси доставки
router.get('/addresses', authenticateUser, async (req: AuthRequest, res: any) => {
  try {
    const rows = await prisma.userAddress.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, address: true, createdAt: true },
    });
    res.json({ addresses: rows.map(serializeUserAddress) });
  } catch (error) {
    console.error('Ошибка GET /auth/addresses:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/addresses', authenticateUser, async (req: AuthRequest, res: any) => {
  const { address } = req.body ?? {};
  const trimmed = String(address ?? '').trim();

  if (trimmed.length < 3) {
    return res.status(400).json({ message: 'Укажите адрес доставки' });
  }
  if (trimmed.length > 500) {
    return res.status(400).json({ message: 'Адрес слишком длинный' });
  }

  try {
    const userId = req.user!.id;
    const duplicate = await prisma.userAddress.findFirst({
      where: { userId, address: trimmed },
    });
    if (duplicate) {
      return res.status(400).json({ message: 'Этот адрес уже сохранён' });
    }

    const created = await prisma.userAddress.create({
      data: { userId, address: trimmed },
      select: { id: true, address: true, createdAt: true },
    });
    const primary = await syncUserPrimaryAddress(prisma, userId);
    res.status(201).json({
      address: serializeUserAddress(created),
      primaryAddress: primary,
    });
  } catch (error) {
    console.error('Ошибка POST /auth/addresses:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/addresses/:id', authenticateUser, async (req: AuthRequest, res: any) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: 'Некорректный адрес' });
  }

  try {
    const userId = req.user!.id;
    const row = await prisma.userAddress.findFirst({
      where: { id, userId },
    });
    if (!row) {
      return res.status(404).json({ message: 'Адрес не найден' });
    }

    await prisma.userAddress.delete({ where: { id } });
    const primary = await syncUserPrimaryAddress(prisma, userId);
    res.json({ primaryAddress: primary });
  } catch (error) {
    console.error('Ошибка DELETE /auth/addresses/:id:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
