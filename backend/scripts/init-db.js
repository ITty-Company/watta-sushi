import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function initDatabase() {
  try {
    console.log('🔄 Проверка подключения к базе данных...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'установлен' : 'НЕ УСТАНОВЛЕН!')
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL не установлен! Проверьте конфигурацию в Render Dashboard.')
      process.exit(1)
    }

    console.log('🗄️  prisma migrate deploy…')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })

    // Проверяем подключение
    await prisma.$connect()
    console.log('✅ Подключение к базе данных установлено')
    
    // Проверяем, есть ли уже данные (например, категории)
    let categoriesCount = 0
    let usersCount = 0
    
    try {
      categoriesCount = await prisma.category.count()
      usersCount = await prisma.user.count()
    } catch (error) {
      console.error('❌ Не удалось прочитать таблицы после migrate deploy:', error?.message || error)
      console.error('   Проверьте DATABASE_URL и что все миграции в prisma/migrations применены.')
      process.exit(1)
    }
    
    console.log(`📊 Текущее состояние БД: ${categoriesCount} категорий, ${usersCount} пользователей`)
    
    // Если база пустая, выполняем seed
    if (categoriesCount === 0 || usersCount === 0) {
      console.log('🌱 База данных пустая, выполняем seed...')
      execSync('npm run seed', { stdio: 'inherit' })
      console.log('✅ Seed выполнен')
    } else {
      console.log('✅ База данных уже инициализирована')
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

initDatabase()
