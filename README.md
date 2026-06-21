# Arbolit site deployment

Это не полностью статический сайт: форма заказа отправляет данные в Node.js/Express сервер. Поэтому для выгрузки нужен хостинг с поддержкой Node.js, например Render, Railway, VPS, Beget/Timeweb с Node.js, Selectel Cloud или похожий сервис.

## Что загружать

Загружайте весь проект, кроме файлов из `.gitignore`:

- `node_modules/` и `server/node_modules/` не загружать, хостинг установит зависимости сам.
- `server/.env` не загружать в публичный репозиторий, там должны быть пароли.
- `server/orders.db`, `server/orders/*.json`, `server/*.log` не загружать как код проекта.

## Требования

- Node.js 22 или новее.
- Возможность задать переменные окружения.
- Открытый HTTP-порт, который хостинг передаст в `PORT`.

## Deploy на Railway

1. Загрузите проект в GitHub.
2. В Railway создайте New Project из GitHub repo.
3. Выберите репозиторий `arbolit-site`.
4. В Settings/Variables задайте переменные окружения из блока ниже.
5. В Storage/Volumes добавьте volume для сервиса. Если Railway передаст `RAILWAY_VOLUME_MOUNT_PATH`, база `orders.db` будет храниться там автоматически.
6. Дождитесь деплоя и откройте домен Railway вида `*.railway.app`.
7. Проверьте `https://your-app.railway.app/api/health`.

Свой домен можно купить и подключить позже. Для первой проверки домен Railway уже подходит.

## Команды для хостинга

Если хостинг запускает проект из корня:

```bash
npm install
npm start
```

Если хостинг просит отдельные поля:

```bash
Build command: npm install
Start command: npm start
```

Корневой `package.json` сам установит зависимости из папки `server` через `postinstall`.

## Переменные окружения

На хостинге задайте переменные из `server/.env.example`:

```env
PORT=3000
MAIL_ENABLED=true
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

Telegram is the recommended free notification channel on Railway. Create a bot via `@BotFather`, send any message to the bot, then get your chat id from `https://api.telegram.org/bot<token>/getUpdates`.

SMTP fallback variables:

```env
EMAIL_HOST=smtp.yandex.ru
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_TLS_SERVERNAME=smtp.yandex.ru
EMAIL_USER=your-mail@yandex.ru
EMAIL_PASS=your-app-password
ADMIN_EMAIL=manager@example.com
```

Обычно `PORT` можно не задавать вручную: многие хостинги сами передают его приложению. `DB_PATH` тоже можно не задавать на Railway, если подключен Volume. Для Яндекс.Почты нужен пароль приложения, а не обычный пароль от почты.

## Проверка после деплоя

Откройте:

```text
https://your-domain.ru/api/health
```

Должен прийти JSON с `"success": true`.

Потом откройте главную страницу и отправьте тестовый заказ. Если заказ сохраняется, но письмо не приходит, проверьте SMTP-переменные и разрешает ли хостинг исходящие подключения к `smtp.yandex.ru:465`.

## Локальный запуск

```powershell
cd C:\Users\Игорь\Desktop\arbolit-site
npm.cmd install
npm.cmd start
```

Сайт будет доступен на:

```text
http://localhost:3000/
```
