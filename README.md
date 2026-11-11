# SwiftDrop

SwiftDrop: веб-приложение и информационная система курьерской доставки.

## Требования

- Node.js 24 (версия задана в `.nvmrc`, с nvm: `nvm use`).
- Docker с Docker Compose (PostgreSQL и S3-совместимое хранилище для разработки).
- Stripe CLI, если нужно проверять оплату локально (см. раздел «Платежи»).

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

| Переменная              | Назначение                                                               | Пример                                                           |
| ----------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `NODE_ENV`              | Окружение: `development`, `test` или `production`                        | `development`                                                    |
| `PORT`                  | Порт backend                                                             | `8080`                                                           |
| `APP_URL`               | Публичный адрес frontend, на него Stripe возвращает клиента после оплаты | `http://localhost:5173`                                          |
| `POSTGRES_USER`         | Пользователь PostgreSQL в docker compose                                 | `swiftdrop`                                                      |
| `POSTGRES_PASSWORD`     | Пароль PostgreSQL в docker compose                                       | `swiftdrop`                                                      |
| `POSTGRES_DB`           | Имя основной базы                                                        | `swiftdrop`                                                      |
| `POSTGRES_PORT`         | Порт PostgreSQL на хосте                                                 | `5432`                                                           |
| `DATABASE_URL`          | Подключение backend и drizzle-kit к базе                                 | `postgresql://swiftdrop:swiftdrop@localhost:5432/swiftdrop`      |
| `TEST_DATABASE_URL`     | База для тестов, имя должно оканчиваться на `_test`                      | `postgresql://swiftdrop:swiftdrop@localhost:5432/swiftdrop_test` |
| `S3_ENDPOINT`           | Адрес S3-хранилища                                                       | `http://localhost:9000`                                          |
| `S3_ACCESS_KEY`         | Ключ доступа хранилища (контейнер `storage`)                             | `swiftdrop`                                                      |
| `S3_SECRET_KEY`         | Секретный ключ хранилища (контейнер `storage`)                           | `swiftdrop123`                                                   |
| `S3_BUCKET`             | Имя бакета                                                               | `swiftdrop`                                                      |
| `OSRM_URL`              | Адрес сервиса маршрутизации OSRM                                         | `https://routing.openstreetmap.de`                               |
| `SEED_ADMIN_EMAIL`      | Email администратора, которого создаёт `db:seed`                         | `admin@swiftdrop.local`                                          |
| `SEED_ADMIN_PASSWORD`   | Пароль этого администратора                                              | `Admin12345`                                                     |
| `JWT_ACCESS_SECRET`     | Секрет подписи access-токенов, не короче 32 символов                     | случайная строка                                                 |
| `GOOGLE_CLIENT_ID`      | OAuth-клиент Google                                                      | из Google Cloud Console                                          |
| `GOOGLE_CLIENT_SECRET`  | Секрет OAuth-клиента Google                                              | из Google Cloud Console                                          |
| `GOOGLE_CALLBACK_URL`   | Адрес возврата после входа через Google                                  | `http://localhost:5173/api/auth/google/callback`                 |
| `YANDEX_CLIENT_ID`      | OAuth-клиент Яндекса                                                     | из Яндекс OAuth                                                  |
| `YANDEX_CLIENT_SECRET`  | Секрет OAuth-клиента Яндекса                                             | из Яндекс OAuth                                                  |
| `YANDEX_CALLBACK_URL`   | Адрес возврата после входа через Яндекс                                  | `http://localhost:5173/api/auth/yandex/callback`                 |
| `STRIPE_SECRET_KEY`     | Секретный ключ Stripe тестового режима, начинается с `sk_test_`          | из Stripe Dashboard                                              |
| `STRIPE_WEBHOOK_SECRET` | Секрет подписи вебхука, начинается с `whsec_`                            | вывод `stripe listen --print-secret`                             |
| `VITE_MAPBOX_TOKEN`     | Публичный токен Mapbox для frontend                                      | `pk....`                                                         |

Отдельно:

- `OSRM_URL` обязателен: backend не стартует без него, и через него считается маршрут для расчёта стоимости.
- `VITE_MAPBOX_TOKEN` нужен для карты и поиска адресов; без него вместо карты показывается заглушка. Токен вшивается в сборку frontend на этапе `npm run build`, поэтому в CI и Docker его нужно передавать при сборке, а не при запуске.
- `NODE_ENV` обязателен: в `production` cookie сессии получают флаг `Secure`. Тесты Jest задают `test` сами.
- Backend при старте проверяет `NODE_ENV`, `APP_URL`, `DATABASE_URL`, `OSRM_URL`, `JWT_ACCESS_SECRET`, `STRIPE_*` и все `GOOGLE_*`, `YANDEX_*`: без них он не запустится. Ключ Stripe должен начинаться с `sk_`, секрет вебхука с `whsec_`.

## Платежи (Stripe, тестовый режим)

Оплата идёт через Stripe Checkout: клиент попадает на страницу Stripe, данные карты вводит только там. Заказ в рублях, Stripe списывает доллары по актуальному курсу Нацбанка РБ. Заказ становится оплаченным только после вебхука от Stripe, а не после возврата клиента на сайт.

Stripe не может достучаться до `localhost`, поэтому локально события пересылает Stripe CLI:

1. Установите Stripe CLI (на Windows: `winget install Stripe.StripeCli`, либо архив со страницы релизов `stripe/stripe-cli` на GitHub) и войдите в аккаунт тестового режима:

```bash
   stripe login
```

2. Получите секрет подписи вебхука и сохраните его в `.env` как `STRIPE_WEBHOOK_SECRET`:

```bash
   stripe listen --print-secret
```

3. В отдельном терминале запустите пересылку событий на backend (напрямую на порт API, не через frontend) и оставьте его работать, пока проверяете оплату:

```bash
   stripe listen --forward-to localhost:8080/api/payments/webhook --events "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.expired"
```

4. Оформите заказ и оплатите его на странице Stripe тестовой картой:

   | Карта                 | Результат       |
   | --------------------- | --------------- |
   | `4242 4242 4242 4242` | оплата проходит |
   | `4000 0000 0000 0002` | карта отклонена |

   Срок действия любой будущий, CVC любой, имя и почта любые.

Как это работает:

- Неоплаченный заказ отменяется через 30 минут, сессия оплаты закрывается.
- Отмена оплаченного заказа возвращает деньги автоматически.
- Если оплата пришла за уже отменённый заказ, деньги возвращаются автоматически.
- В тестах e2e Stripe не вызывается: платёжный шлюз подменяется, Stripe CLI для тестов не нужен.

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

## Frontend

Код в `frontend/src` разложен по слоям Feature-Sliced Design, сверху вниз:

| Слой        | Что лежит                                                             |
| ----------- | --------------------------------------------------------------------- |
| `app/`      | точка входа, роутер, макеты, глобальные стили и подписки              |
| `pages/`    | страницы, их логика и UI                                              |
| `features/` | действия пользователя, которые нужны нескольким страницам             |
| `entities/` | доменные модели, которые нужны нескольким срезам                      |
| `shared/`   | инфраструктура без бизнес-логики: UI-кит, API-клиент, сессия, утилиты |

Правила:

- Импорт только вниз: слой берёт код лишь из слоёв ниже себя, срезы одного слоя друг друга не импортируют.
- Срез отдаёт наружу только то, что экспортирует его `index.ts` (в `shared` свой `index.ts` у каждого сегмента); импорт внутренних файлов чужого среза запрещён.
- Импорты идут через алиасы `@/app`, `@/pages`, `@/features`, `@/entities`, `@/shared`.

Проверки (из `frontend`):

```bash
npm run lint       # oxlint
npm run lint:fsd   # Steiger, правила FSD
npm run build      # проверка типов и сборка
npm run test:unit  # unit-тесты моделей (src/**/*.test.ts) в Node через Playwright Test, без браузера и серверов
npm run test:e2e   # сквозные тесты Playwright: нужны поднятый в Docker PostgreSQL, миграции и db:seed
```

## Структура репозитория

```text
backend/                 API на NestJS, Drizzle ORM, миграции в backend/drizzle, тесты в backend/test
frontend/                SPA на React, Vite и Tailwind CSS, слои FSD в frontend/src (см. раздел «Frontend»)
.github/workflows/ci.yml CI: lint, build и тесты backend, lint, lint:fsd и build frontend
docker-compose.dev.yml   PostgreSQL и S3-хранилище для разработки
.env.example             шаблон единого .env
.nvmrc                   версия Node.js
```

Импорты в backend: внутри своего модуля (`src/modules/<feature>`, `src/integrations/<name>`, `src/common/<area>`) пути относительные (`./`, `../`), за его пределами — через алиасы `@/` (`backend/src`) и `@test/` (`backend/test`). Импорты `../../` и глубже запрещены правилом `no-restricted-imports` в `backend/.oxlintrc.json`.
