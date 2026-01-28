# Деплой на Render

## Важно: Порядок создания ресурсов

1. **Сначала создайте базу данных** в Render Dashboard:
   - **New** → **PostgreSQL**
   - Имя: `watta-sushi-db`
   - План: Free
   - Регион: выберите тот же регион, где будет бэкенд

2. **Затем создайте сервисы** через Blueprint (render.yaml) или вручную

## Если `DATABASE_URL` не подхватывается автоматически

Если после создания базы данных переменная `DATABASE_URL` все еще не установлена:

1. **Render Dashboard** → **PostgreSQL** (`watta-sushi-db`) → **Info**
2. Скопируйте **Internal Database URL** (для сервисов в том же регионе) или **External Database URL**
3. **Web Service** (`watta-sushi-backend`) → **Environment**
4. Добавьте переменную:
   - **Key:** `DATABASE_URL`
   - **Value:** вставьте скопированный URL
5. **Save Changes** → **Manual Deploy** (или дождитесь автодеплоя)

**Важно:** Убедитесь, что имя базы данных в `render.yaml` (`watta-sushi-db`) точно совпадает с именем в Render Dashboard!

## JWT_SECRET

В **watta-sushi-backend** → **Environment** добавьте:

- **Key:** `JWT_SECRET`
- **Value:** любая случайная строка (например, `openssl rand -base64 32`)

**Важно:** Эта переменная обязательна для работы аутентификации!

## Проверка

- Бэкенд: `https://watta-sushi-9qfh.onrender.com` → «🍣 Sushi API is running cleanly!»
- Фронтенд: `https://watta-sushi-web.onrender.com`
- Логин: `admin@sushi.com` / `admin123` (после успешного seed)

## Устранение проблем

### Ошибка: "Environment variable not found: DATABASE_URL"

1. Проверьте, что база данных `watta-sushi-db` создана в Render Dashboard
2. Убедитесь, что имя базы данных точно совпадает с именем в `render.yaml`
3. Проверьте, что сервис `watta-sushi-backend` находится в том же регионе, что и база данных
4. Если переменная не установилась автоматически, добавьте её вручную (см. выше)

### Ошибка: "NEXT_PUBLIC_API_URL не установлен в production"

1. Проверьте, что переменная `NEXT_PUBLIC_API_URL` установлена в сервисе `watta-sushi-web`
2. Убедитесь, что значение равно `https://watta-sushi-9qfh.onrender.com`
3. Перезапустите сервис после изменения переменных окружения
