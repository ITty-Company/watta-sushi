# Суши Ватта

Приложение для заказа суши и роллов, доступное на iOS, Android и веб-платформе.

## Структура проекта

```
суши ватта/
├── backend/          # Бэкенд (Express.js + Prisma)
├── web/              # Веб-сайт (Next.js/React)
├── ios/              # iOS приложение (Swift/SwiftUI)
└── android/          # Android приложение (Kotlin/Jetpack Compose)
```

## Быстрый старт (чтобы работал веб-сайт)

Нужны **Node.js 18+** и **npm**. База данных в этом проекте — **PostgreSQL** (не SQLite). Фронтенд ходит в API по **`http://127.0.0.1:5050`** (порт **5050**, не 8000 и не 5000 — на macOS порт 5000 часто занят AirPlay).

### Вариант A (рекомендуется): Docker + скрипты из корня репозитория

1. Клонируйте репозиторий и перейдите в папку проекта:
```bash
git clone <repository-url>
cd <папка-репозитория>
```

2. Установите зависимости корня (для `concurrently` и скриптов), поднимите БД и примените миграции с сидом:
```bash
npm install
npm run local:prepare
```
   Нужен запущенный **Docker Desktop** (скрипт поднимает Postgres из `docker-compose.yml`, порт на хосте **55432** — см. `backend/.env.docker.example`).

3. Запустите **и Next.js, и бэкенд одной командой**:
```bash
npm run local:all
```

4. Откройте в браузере: **[http://localhost:3000](http://localhost:3000)**  
   API: `http://127.0.0.1:5050`  
   Скрипт `local:web` принудительно выставляет `NEXT_PUBLIC_API_URL=http://127.0.0.1:5050`, чтобы прокси Next.js всегда бил в локальный Express.

### Вариант B: свой PostgreSQL без Docker

```bash
cp backend/.env.example backend/.env
# Укажите DATABASE_URL и JWT_SECRET в backend/.env
SKIP_DOCKER=1 npm run local:prepare
npm run local:all
```

(Убедитесь, что строка подключения указывает на **ваш** инстанс Postgres и база/пользователь существуют.)

### Вариант C: только фронт без бэкенда (мок-данные)

```bash
npm run local:web:mock
```

Подробнее про переменные фронта: `web/.env.example`. Продакшен на Render описан в `render.yaml` и `DEPLOY.md` (переменная **`NEXT_PUBLIC_API_URL`** = публичный URL API).

## Бэкенд

### Требования
- Node.js 18.0 или выше
- npm или yarn

### Установка и запуск

1. Создайте `backend/.env` из `backend/.env.example` или `backend/.env.docker.example` (см. раздел «Быстрый старт»). Обязательны **`DATABASE_URL`** (PostgreSQL) и **`JWT_SECRET`**. Порт API по умолчанию: **`PORT=5050`**.
2. Установите зависимости и примените миграции:
```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
```
3. Режим разработки:
```bash
npm run dev
```
Продакшен-старт (как на Render): `npm run start:single`.

Удобнее из **корня** репозитория: `npm run local:prepare` затем `npm run local:all`.

### Структура
- `server.js` - основной файл сервера
- `routes/` - маршруты API
- `prisma/` - схема базы данных и миграции

## Функциональность

- 📋 **Меню** - просмотр блюд по категориям (Роллы, Суши, Сеты, Напитки)
- 🛒 **Корзина** - добавление товаров и оформление заказа
- 👤 **Профиль** - информация о пользователе и история заказов

## iOS Приложение

### Требования
- Xcode 15.0 или выше
- iOS 17.0 или выше
- Swift 5.0

### Установка и запуск

1. Откройте проект в Xcode:
```bash
cd ios/SushiVatta
open SushiVatta.xcodeproj
```

2. Выберите симулятор или подключенное устройство
3. Нажмите Run (⌘R)

### Структура
- `SushiVattaApp.swift` - точка входа приложения
- `ContentView.swift` - основной интерфейс с вкладками

## Android Приложение

### Требования
- Android Studio Hedgehog или выше
- JDK 8 или выше
- Android SDK 24+ (минимум), 34 (целевой)

### Установка и запуск

1. Откройте проект в Android Studio:
```bash
cd android
```

2. Откройте папку `android` в Android Studio
3. Дождитесь синхронизации Gradle
4. Нажмите Run (▶️)

### Структура
- `MainActivity.kt` - главная активность
- `MainScreen.kt` - основной UI с навигацией
- `ui/theme/` - тема приложения

## Веб-сайт

### Требования
- Node.js 18+
- Запущенный бэкенд на **127.0.0.1:5050** (или задайте `NEXT_PUBLIC_API_URL`)

### Установка и запуск

**Рекомендуется с корня:** `npm run local:all` — поднимает API и Next.js с правильным `NEXT_PUBLIC_API_URL`.

Отдельно только фронт:
```bash
cd web
npm install
npm run dev
```
При ручном запуске задайте в `web/.env.development` или в окружении: `NEXT_PUBLIC_API_URL=http://127.0.0.1:5050` (см. `web/.env.example`).

### Сборка для продакшена

Перед сборкой в проде должен быть задан **`NEXT_PUBLIC_API_URL`** (URL вашего API, без слэша в конце).

```bash
cd web
npm install
npm run build
npm start
```

### Структура
- `app/page.tsx` - главная страница
- `app/components/` - компоненты интерфейса
- `app/globals.css` - глобальные стили

## Технологии

### iOS
- **SwiftUI** - современный UI фреймворк
- **Swift** - язык программирования

### Android
- **Jetpack Compose** - современный UI toolkit
- **Kotlin** - язык программирования
- **Material Design 3** - дизайн-система

### Бэкенд
- **Express.js** — веб-фреймворк для Node.js
- **Prisma** — ORM
- **PostgreSQL** — локально через Docker (`npm run local:prepare`) или свой инстанс; в продакшене — см. `render.yaml`

### Веб
- **Next.js 14** - React фреймворк
- **TypeScript** - типизированный JavaScript
- **CSS Modules** - стилизация

## Разработка

Все три платформы имеют одинаковую функциональность:
- Просмотр меню с категориями
- Добавление товаров в корзину
- Оформление заказа
- Профиль пользователя

## Лицензия

Проект создан для "Суши Ватта"

