# Watta Sushi — локальний print-server для термопринтера

Цей скрипт запускається на комп'ютері в ресторані (або Raspberry Pi),
підключеному до термопринтера через USB. Він кожні N секунд опитує
бекенд Watta Sushi на предмет нових оплачених замовлень і друкує чеки.

## Вимоги

- **Node.js 18+**
- **Термопринтер** (Epson TM, Star SP700 або сумісний) підключений через USB
- **Tailscale** (опціонально, для безпечного доступу)

## Встановлення

```bash
cd scripts/print-server
cp .env.example .env
# Відредагуйте .env — вкажіть API_URL, PRINT_SERVER_TOKEN, тип принтера

npm install
# або: pnpm install / yarn install
```

## Налаштування .env

| Параметр | Опис |
|---|---|
| `API_URL` | URL вашого бекенду (Render) |
| `PRINT_SERVER_TOKEN` | Токен, який ви задали в `backend/.env` (або Render secrets) |
| `POLL_INTERVAL_SEC` | Як часто перевіряти нові замовлення (сек) |
| `PRINTER_TYPE` | `EPSON`, `STAR` або `CUSTOM` |
| `PRINTER_INTERFACE` | `usb`, `tcp://IP:9100` або `serial:/dev/usb/lp0` |
| `PRINTER_WIDTH_MM` | Ширина паперу: `58` або `80` |
| `PRINTER_CHARACTER_SET` | Кодування: `CP866` (кирилиця EPSON) |

## Налаштування токена на бекенді

Додайте в `backend/.env` або Render secrets:

```
PRINT_SERVER_TOKEN=придумайте-складний-токен
```

## Запуск

```bash
# Тестовий запуск
node print-server.js

# Або через pm2 (рекомендовано — автозапуск + перезапуск при падінні)
npm install -g pm2
pm2 start print-server.js --name watta-print-server
pm2 save
pm2 startup  # автозапуск після перезавантаження
```

## Tailscale (опціонально)

Якщо сервер у ресторані не має прямого доступу до інтернету,
встановіть Tailscale і використовуйте Tailscale IP:

```
API_URL=http://100.x.x.x:5050
```

## Тестування принтера

```bash
node print-server.js --test-print
```

Це надрукує тестовий чек для перевірки підключення.
