import { PrismaClient } from './generated/prisma/index.js';
import crypto from 'crypto';


async function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function initDatabase() {
  try {
    console.log('🚀 Начинаем инициализацию базы данных...\n');

    // 1. Проверяем и создаем админа
    const adminEmail = 'admin@sushiicon.com';
    let owner = await prisma.owner.findUnique({ where: { email: adminEmail } });
    
    if (!owner) {
      owner = await prisma.owner.create({
        data: {
          email: adminEmail,
          name: 'Администратор',
          accessCode: 'ADMIN001',
          password: await hashPassword('admin123'),
          isActive: true,
        }
      });
      console.log('✅ Администратор создан:');
      console.log(`   Email: ${owner.email}`);
      console.log(`   Access Code: ADMIN001`);
      console.log(`   Password: admin123\n`);
    } else {
      console.log('✅ Администратор уже существует\n');
    }

    // 2. Подсчитываем текущих клиентов
    const customersCount = await prisma.customer.count();
    console.log(`📊 Текущее количество клиентов: ${customersCount}`);

    // 3. Добавляем тестовых клиентов если их нет
    if (customersCount < 5) {
      const testCustomers = [
        {
          firstName: 'Анна',
          lastName: 'Петрова',
          phoneNumber: '+31612345671',
          email: 'anna@example.com',
          birthDate: new Date('1995-03-15'),
          city: 'Amsterdam',
          preferredFood: 'sushi',
          feedback: 'Отличное качество!',
          country: 'NL',
          discountCode: 'ANNA2024'
        },
        {
          firstName: 'Петр',
          lastName: 'Иванов',
          phoneNumber: '+31612345672',
          email: 'petr@example.com',
          birthDate: new Date('1988-07-22'),
          city: 'Rotterdam',
          preferredFood: 'rolls',
          feedback: 'Быстрая доставка',
          country: 'NL',
          discountCode: 'PETR2024'
        },
        {
          firstName: 'Мария',
          lastName: 'Сидорова',
          phoneNumber: '+31612345673',
          email: 'maria@example.com',
          birthDate: new Date('1992-11-08'),
          city: 'Utrecht',
          preferredFood: 'sashimi',
          feedback: 'Вкусно и свежо',
          country: 'NL',
          discountCode: 'MARIA2024'
        },
        {
          firstName: 'Иван',
          lastName: 'Козлов',
          phoneNumber: '+31612345674',
          email: 'ivan@example.com',
          birthDate: new Date('1985-05-30'),
          city: 'Den Haag',
          preferredFood: 'sushi',
          feedback: 'Супер!',
          country: 'NL',
          discountCode: 'IVAN2024'
        },
        {
          firstName: 'Елена',
          lastName: 'Смирнова',
          phoneNumber: '+31612345675',
          email: 'elena@example.com',
          birthDate: new Date('1990-09-12'),
          city: 'Eindhoven',
          preferredFood: 'rolls',
          feedback: 'Рекомендую всем!',
          country: 'NL',
          discountCode: 'ELENA2024'
        }
      ];

      for (const customer of testCustomers) {
        try {
          const created = await prisma.customer.create({ data: customer });
          console.log(`✅ Клиент создан: ${created.firstName} ${created.lastName}`);
        } catch (e) {
          if (e.code === 'P2002') {
            console.log(`⏭️  Клиент ${customer.firstName} уже существует`);
          } else {
            throw e;
          }
        }
      }
    } else {
      console.log('✅ В базе уже есть достаточно клиентов\n');
    }

    // 4. Статистика
    const finalStats = {
      owners: await prisma.owner.count(),
      customers: await prisma.customer.count(),
      sessions: await prisma.ownerLoginSession.count(),
      subscriptions: await prisma.messageSubscription.count(),
    };

    console.log('\n📊 Итоговая статистика:');
    console.log(`   Администраторов: ${finalStats.owners}`);
    console.log(`   Клиентов: ${finalStats.customers}`);
    console.log(`   Сессий: ${finalStats.sessions}`);
    console.log(`   Подписок: ${finalStats.subscriptions}`);

    console.log('\n🎉 Инициализация завершена успешно!');
    console.log('\n📝 Данные для входа в админ-панель:');
    console.log('   Email: admin@sushiicon.com');
    console.log('   Access Code: ADMIN001');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Ошибка при инициализации:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();

