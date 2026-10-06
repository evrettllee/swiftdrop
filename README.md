# SwiftDrop

SwiftDrop (DeliveryIS): веб-приложение и информационная система курьерской доставки.

## Требования

- Node.js 24 (версия задана в `.nvmrc`, с nvm: `nvm use`).
- Docker с Docker Compose (PostgreSQL и S3-совместимое хранилище для разработки).

## Запуск разработки

1. Создайте `.env` в корне репозитория из шаблона и заполните пустые значения (см. таблицу ниже):

   ```bash
   cp .env.example .env
   ```

   Файл `.env` один на весь репозиторий: backend и drizzle-kit читают `../.env`, frontend получает его через `envDir: '..'` в `vite.config.ts`.

2. Установите зависимости:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Поднимите PostgreSQL и хранилище (из корня репозитория):

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

4. Примените миграции и заполните справочники (роли, тариф, зона Минска, администратор из `SEED_ADMIN_*`):

   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```

5. Запустите backend (API на `http://localhost:8080`, порт из `PORT`):

   ```bash
   cd backend && npm run start:dev
   ```

6. Запустите frontend в отдельном терминале (`http://localhost:5173`, запросы `/api` проксируются на backend):

   ```bash
   cd frontend && npm run dev
   ```

## Переменные окружения

Шаблон: `.env.example` в корне. Значения ниже подходят для локальной разработки; секреты в репозиторий не коммитятся.

| Переменная | Назначение | Пример |
| --- | --- | --- |
| `PORT` | Порт backend | `8080` |
| `POSTGRES_USER` | Пользователь PostgreSQL в docker compose | `swiftdrop` |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL в docker compose | `swiftdrop` |
| `POSTGRES_DB` | Имя основной базы | `swiftdrop` |
| `POSTGRES_PORT` | Порт PostgreSQL на хосте | `5432` |
| `DATABASE_URL` | Подключение backend и drizzle-kit к базе | `postgresql://swiftdrop:swiftdrop@localhost:5432/swiftdrop` |
| `TEST_DATABASE_URL` | База для тестов, имя должно оканчиваться на `_test` | `postgresql://swiftdrop:swiftdrop@localhost:5432/swiftdrop_test` |
| `S3_ENDPOINT` | Адрес S3-хранилища | `http://localhost:9000` |
| `S3_ACCESS_KEY` | Ключ доступа хранилища (контейнер `storage`) | `swiftdrop` |
| `S3_SECRET_KEY` | Секретный ключ хранилища (контейнер `storage`) | `swiftdrop123` |
| `S3_BUCKET` | Имя бакета | `swiftdrop` |
| `OSRM_URL` | Адрес сервиса маршрутизации OSRM | `https://routing.openstreetmap.de` |
| `SEED_ADMIN_EMAIL` | Email администратора, которого создаёт `db:seed` | `admin@swiftdrop.local` |
| `SEED_ADMIN_PASSWORD` | Пароль этого администратора | `Admin12345` |
| `JWT_ACCESS_SECRET` | Секрет подписи access-токенов, не короче 32 символов | случайная строка |
| `GOOGLE_CLIENT_ID` | OAuth-клиент Google | из Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Секрет OAuth-клиента Google | из Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | Адрес возврата после входа через Google | `http://localhost:5173/api/auth/google/callback` |
| `YANDEX_CLIENT_ID` | OAuth-клиент Яндекса | из Яндекс OAuth |
| `YANDEX_CLIENT_SECRET` | Секрет OAuth-клиента Яндекса | из Яндекс OAuth |
| `YANDEX_CALLBACK_URL` | Адрес возврата после входа через Яндекс | `http://localhost:5173/api/auth/yandex/callback` |
| `VITE_MAPBOX_TOKEN` | Публичный токен Mapbox для frontend | `pk....` |

Отдельно:

- `OSRM_URL` обязателен: backend не стартует без него, и через него считается маршрут для расчёта стоимости.
- `VITE_MAPBOX_TOKEN` нужен для карты и поиска адресов; без него вместо карты показывается заглушка. Токен вшивается в сборку frontend на этапе `npm run build`, поэтому в CI и Docker его нужно передавать при сборке, а не при запуске.
- Backend при старте проверяет `DATABASE_URL`, `OSRM_URL`, `JWT_ACCESS_SECRET` и все `GOOGLE_*`, `YANDEX_*`: без них он не запустится.

## Проверки

В каждом из пакетов (`backend` и `frontend`):

```bash
npm run lint
npm run build
```

Тесты backend:

```bash
cd backend
npm test           # unit
npm run test:e2e   # e2e
```

E2e-тесты работают с отдельной базой `swiftdrop_test` из `TEST_DATABASE_URL` (имя обязано оканчиваться на `_test`, миграции применяются автоматически, данные очищаются между тестами). Docker compose создаёт только основную базу, тестовую нужно создать один раз:

```bash
docker exec swiftdrop-postgres createdb -U swiftdrop swiftdrop_test
```

## Структура репозитория

```text
backend/                 API на NestJS, Drizzle ORM, миграции в backend/drizzle, тесты в backend/test
frontend/                SPA на React, Vite и Tailwind CSS, код по фичам в frontend/src/features
.github/workflows/ci.yml CI: lint, build и тесты backend, lint и build frontend
docker-compose.dev.yml   PostgreSQL и S3-хранилище для разработки
.env.example             шаблон единого .env
.nvmrc                   версия Node.js
```
