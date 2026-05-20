import { PrismaClient } from '@prisma/client'
import { execSync, spawnSync } from 'child_process'
import { readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()
const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * @returns {{ ok: boolean, out: string }}
 */
function runMigrateDeploy() {
  const r = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: backendRoot,
    encoding: 'utf8',
    env: process.env,
  })
  if (r.stdout) process.stdout.write(r.stdout)
  if (r.stderr) process.stderr.write(r.stderr)
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}` }
}

/** Имена папок в prisma/migrations (как ожидает `migrate resolve --applied`). */
function listSortedMigrationDirs() {
  const mDir = join(backendRoot, 'prisma', 'migrations')
  return readdirSync(mDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort()
}

/**
 * Baseline для уже заполненной БД без таблицы _prisma_migrations (ошибка P3005).
 * @see https://www.prisma.io/docs/guides/migrate/production-troubleshooting#baseline-a-database-with-migrations
 */
/** Имя миграции из вывода P3009 (failed migration record). */
function parseFailedMigrationName(output) {
  const m = output.match(/The `([^`]+)` migration started at/)
  return m?.[1] ?? null
}

/**
 * Сбрасывает failed-запись в _prisma_migrations, чтобы deploy мог применить миграцию снова.
 * Нужно после P3018 (например, таблица уже существовала до фикса idempotent SQL).
 */
function markMigrationRolledBack(name) {
  console.log(`📌 migrate resolve --rolled-back "${name}"`)
  const rr = spawnSync('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', name], {
    cwd: backendRoot,
    encoding: 'utf8',
    env: process.env,
  })
  if (rr.stdout) process.stdout.write(rr.stdout)
  if (rr.stderr) process.stderr.write(rr.stderr)
  return rr.status === 0
}

function markAllMigrationsResolved() {
  const names = listSortedMigrationDirs()
  console.log(`📌 Baseline: prisma migrate resolve --applied (${names.length} migrations)`)
  for (const name of names) {
    const rr = spawnSync('npx', ['prisma', 'migrate', 'resolve', '--applied', name], {
      cwd: backendRoot,
      encoding: 'utf8',
      env: process.env,
    })
    if (rr.stdout) process.stdout.write(rr.stdout)
    if (rr.stderr) process.stderr.write(rr.stderr)
    if (rr.status !== 0) {
      throw new Error(`migrate resolve --applied "${name}" failed (status ${rr.status})`)
    }
  }
}

async function initDatabase() {
  try {
    console.log('🔄 Проверка подключения к базе данных...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'установлен' : 'НЕ УСТАНОВЛЕН!')

    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL не установлен! Проверьте конфигурацию в Render Dashboard.')
      process.exit(1)
    }

    console.log('🗄️  prisma migrate deploy…')
    let migrateResult = runMigrateDeploy()

    if (!migrateResult.ok && migrateResult.out.includes('P3005')) {
      if (process.env.PRISMA_SKIP_BASELINE === '1') {
        console.error('❌ P3005 и PRISMA_SKIP_BASELINE=1 — baseline отключён. Настройте БД вручную: https://pris.ly/d/migrate-baseline')
        process.exit(1)
      }
      console.warn('')
      console.warn('⚠️  Prisma P3005: схема БД не пустая, нет истории миграций.')
      console.warn('    Выполняем baseline (помечаем локальные миграции как уже применённые).')
      console.warn('    Подходит, если эта БД уже соответствует текущим файлам в prisma/migrations.')
      console.warn('')
      markAllMigrationsResolved()
      console.log('🗄️  prisma migrate deploy (повтор после baseline)…')
      migrateResult = runMigrateDeploy()
    }

    if (!migrateResult.ok) {
      const failedName = parseFailedMigrationName(migrateResult.out)
      const isFailedRecord = migrateResult.out.includes('P3009') && failedName
      const isAlreadyExists =
        migrateResult.out.includes('P3018') ||
        migrateResult.out.includes('42P07') ||
        migrateResult.out.includes('already exists')

      if (isFailedRecord || (isAlreadyExists && failedName)) {
        const name =
          failedName ||
          migrateResult.out.match(/Applying migration `([^`]+)`/)?.[1] ||
          null
        if (name && markMigrationRolledBack(name)) {
          console.log('🗄️  prisma migrate deploy (повтор после rolled-back)…')
          migrateResult = runMigrateDeploy()
        }
      }
    }

    if (!migrateResult.ok) {
      console.error('❌ prisma migrate deploy не удался.')
      if (migrateResult.out.includes('P3009')) {
        console.error('')
        console.error('   Вручную в Shell Render (папка backend):')
        console.error('   npx prisma migrate resolve --rolled-back <имя_миграции>')
        console.error('   npx prisma migrate deploy')
        console.error('')
      }
      process.exit(1)
    }

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
      execSync('npm run seed', { stdio: 'inherit', cwd: backendRoot })
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
