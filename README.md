![Render](https://img.shields.io/badge/Render-Live-brightgreen?logo=render&style=for-the-badge)

# Resume Builder

Full-stack приложение для создания, редактирования и публикации резюме.

🌐 Live Demo: https://resume-builder-alexbeard.vercel.app/

## Стек

### Frontend
- React 18 + Vite
- TypeScript
- Redux Toolkit
- React Router
- Tailwind CSS
- Supabase Auth (OAuth)

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL (Supabase)
- JWT + bcrypt
- Resend (отправка email)

### Инфраструктура
- Vercel (frontend)
- Render (backend)
- Supabase (database)

## Возможности

- 🔐 Авторизация (JWT + refresh tokens)
- 🔑 Вход через Google (OAuth через Supabase)
- 📝 CRUD резюме (личные данные, опыт, образование, навыки)
- 🎨 Живой предпросмотр
- 🌓 Тёмная и светлая тема (с сохранением в localStorage)
- 🔄 Drag & Drop для сортировки опыта
- 💾 Автосохранение (debounce)
- 📢 Три статуса: черновик / по ссылке / в каталоге
- 🌐 Публичная страница резюме (/view/:username)
- 🔍 Каталог публичных резюме (с поиском, фильтрами и пагинацией)
- 📄 Экспорт резюме в PDF (через системную печать)
- 🔒 Хеширование паролей (bcrypt)
- ✅ Покрытие тестами (Vitest + RTL) — 91 тест
- 📩 Приглашения на собеседование (HR может отправить сообщение автору резюме, оно приходит на email и сохраняется в личном кабинете)

## ⚠️ Примечание по отправке Email (Resend)

В демонстрационных целях для отправки писем используется сервис **Resend** на бесплатном тарифе. 

**Ограничение:** Бесплатный тариф Resend (без подтвержденного домена) позволяет отправлять письма **только на тот email-адрес, который указан в аккаунте Resend**. 

Если вы хотите протестировать отправку приглашения, пожалуйста, убедитесь, что в вашем резюме указан тот же email, что и в аккаунте Resend. В противном случае письмо не будет доставлено (хотя приглашение сохранится в личном кабинете).

*Приношу извинения за это неудобство. Это ограничение демонстрационной версии, а не ошибка логики приложения. Для реального проекта достаточно добавить свой домен в Resend (или использовать Nodemailer + SMTP).*

## Скриншоты

![Дашборд](./screenshots/dashboard.png)
![Редактор](./screenshots/builder.png)
![Каталог](./screenshots/explore.png)

## Локальный запуск

### 1. Клонировать репозиторий
```bash
git clone https://github.com/Alexbeard1998/resume-builder.git
cd resume-builder
```

### 2. Установить зависимости

Frontend:

```bash
npm install
```

Backend:

```bash
cd server
npm install
```

### 3. Настроить переменные окружения

Корень (.env.local):

```text
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://zyxwmmvfifyaavseqvjx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eHdtbXZmaWZ5YWF2c2Vxdmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNTYxNzUsImV4cCI6MjEwNTczMjE3NX0.q5ZBuLcmt6QsXtya6eqOKb84i6yb2UWDGMXuY1Qt50A
```

Сервер (server/.env):

```text
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="..."
REFRESH_SECRET="..."
PORT=3001
RESEND_API_KEY="re_ваш_ключ"
```

### 4. Применить миграции

```bash
cd server
npx prisma migrate dev
```

### 5. Запустить
Backend (терминал 1):

```bash
cd server
npm run dev
```
Frontend (терминал 2):

```bash
npm run dev
```
Открыть http://localhost:5173

### Тесты

```bash
npm run test:run
```

### Структура проекта
```text
resume-builder/
├── src/                     # Frontend
│   ├── app/                 # Store, router
│   ├── components/          # UI-компоненты
│   ├── features/            # Redux-слайсы по фичам
│   ├── api/                 # HTTP-клиент
│   └── utils/               # Хелперы
└── server/                  # Backend
    ├── prisma/              # Схема БД
    └── index.js             # Express-сервер
```

### Лицензия
MIT
