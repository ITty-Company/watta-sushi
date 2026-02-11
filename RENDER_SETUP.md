# 🚀 Настройка Render - Пошаговая инструкция

## Проблема: DATABASE_URL не устанавливается автоматически

Если вы видите ошибку `DATABASE_URL не установлен`, выполните следующие шаги:

## Шаг 1: Создание базы данных PostgreSQL

1. Откройте [Render Dashboard](https://dashboard.render.com)
2. Нажмите **"New +"** → выберите **"PostgreSQL"**
3. Заполните форму:
   ```
   Name: watta-sushi-db
   Database: watta_sushi
   User: watta_sushi_user
   Plan: Free
   Region: выберите тот же регион, где находится ваш бэкенд (например, Frankfurt)
   ```
4. Нажмите **"Create Database"**
5. Дождитесь создания базы данных (обычно 1-2 минуты)

## Шаг 2: Копирование Connection String

1. После создания базы данных откройте её в Dashboard
2. Перейдите на вкладку **"Info"**
3. Найдите секцию **"Connections"**
4. Скопируйте **"Internal Database URL"** (используйте Internal, если бэкенд в том же регионе)
   - Формат: `postgresql://watta_sushi_user:password@hostname:5432/watta_sushi`

## Шаг 3: Добавление переменной DATABASE_URL в бэкенд

1. В Render Dashboard откройте ваш сервис **"watta-sushi-backend"**
2. Перейдите на вкладку **"Environment"**
3. Прокрутите вниз до секции **"Environment Variables"**
4. Нажмите **"Add Environment Variable"**
5. Заполните:
   ```
   Key: DATABASE_URL
   Value: [вставьте скопированный Internal Database URL]
   ```
6. Нажмите **"Save Changes"**
7. Render автоматически перезапустит сервис

## Шаг 4: Добавление JWT_SECRET (если еще не добавлен)

1. В том же разделе **"Environment"** сервиса `watta-sushi-backend`
2. Нажмите **"Add Environment Variable"**
3. Заполните:
   ```
   Key: JWT_SECRET
   Value: [любая случайная строка, например: openssl rand -base64 32]
   ```
   Или сгенерируйте секретный ключ командой:
   ```bash
   openssl rand -base64 32
   ```
4. Нажмите **"Save Changes"**

## Шаг 5: Проверка деплоя

1. Перейдите на вкладку **"Logs"** сервиса `watta-sushi-backend`
2. Дождитесь завершения деплоя
3. Вы должны увидеть:
   ```
   ✅ DATABASE_URL найден: postgresql://...
   ✅ Подключение к базе данных установлено
   🚀 Сервер успешно запущен!
   ```

## Альтернативный способ: Использование Blueprint

Если вы хотите использовать Blueprint для автоматического создания базы данных:

1. Убедитесь, что база данных **НЕ создана** вручную
2. В Render Dashboard нажмите **"New +"** → **"Blueprint"**
3. Подключите ваш GitHub репозиторий
4. Render автоматически создаст базу данных и свяжет её с сервисом

**Важно:** Если база данных уже создана вручную, Blueprint может не связать её автоматически.

## Устранение проблем

### Ошибка: "DATABASE_URL не установлен"
- ✅ Убедитесь, что база данных создана
- ✅ Проверьте, что переменная `DATABASE_URL` добавлена в Environment сервиса
- ✅ Убедитесь, что имя базы данных точно `watta-sushi-db`

### Ошибка: "Connection refused" или "Connection timeout"
- ✅ Проверьте, что используете **Internal Database URL** (если бэкенд в том же регионе)
- ✅ Убедитесь, что база данных и бэкенд в одном регионе
- ✅ Проверьте, что база данных запущена (Status: Available)

### Ошибка: "Authentication failed"
- ✅ Проверьте, что используете правильный User и Password из базы данных
- ✅ Убедитесь, что скопировали полный connection string без лишних пробелов

## Проверка работы

После успешного деплоя:

1. Откройте URL вашего бэкенда (например: `https://watta-sushi-9qfh.onrender.com`)
2. Вы должны увидеть: `🍣 Sushi API is running cleanly!`
3. Проверьте логи - не должно быть ошибок подключения к базе данных

---

**Нужна помощь?** Проверьте логи в Render Dashboard → ваш сервис → Logs
