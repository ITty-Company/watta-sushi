import { execSync } from 'child_process';
import app from './app.js';
import { prisma } from './lib/prisma.ts';

const PORT = process.env.PORT ? Number(process.env.PORT) : 5050; // 5000 на macOS часто зайнятий AirPlay

// --- 4. ЗАПУСК СЕРВЕРА ---
async function startServer() {
  try {
    console.log('🔌 Подключение к базе данных...');
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');

    // Авто-фикс базы данных (если таблиц нет)
    try {
      await prisma.user.count();
    } catch (error) {
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        console.warn('⚠️  Таблицы не найдены. Выполняем prisma db push...');
        execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit' });
        
        console.warn('🌱 Запускаем init-db...');
        // Проверяем, существует ли скрипт, прежде чем запускать
        try {
           execSync('npx tsx scripts/init-db.js', { stdio: 'inherit' });
        } catch (e) {
           console.log('⚠️ Скрипт init-db не найден или упал, пропускаем.');
        }
      }
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен: http://localhost:${PORT} (0.0.0.0:${PORT})`);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal}: graceful shutdown…`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
          console.log('✅ Prisma disconnected');
        } catch (e) {
          console.error('Prisma disconnect:', e);
        }
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 12_000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

startServer();