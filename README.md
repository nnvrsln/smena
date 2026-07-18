# СМЕНА

Одна система для подрядчика, бригадира и рабочего. Текущий визуальный прототип сохранён как UI/UX-эталон, а production-разработка ведётся отдельно.

Перед началом работы откройте [docs/NOW.md](docs/NOW.md). Это единственный короткий документ о текущем этапе.

## Структура

- `apps/web` — production React/PWA;
- `apps/api` — production API;
- `packages/contracts` — общие роли, разрешения и API-типы;
- `infra/postgres` — PostgreSQL-схема;
- `src` и `public` — визуальный прототип, не production-код.

## Production-разработка

```bash
npm install
npm run db:start
npm run dev
```

- Web: `http://127.0.0.1:4174`
- API: `http://127.0.0.1:4180`

На локальном экране входа доступны три dev-аккаунта. Выберите роль в блоке `DEV`; общий локальный пароль `Smena2026!` подставляется автоматически. Эти учётные данные создаются только миграцией development-окружения.

Локальный PostgreSQL работает только внутри проекта на `127.0.0.1:55432`. Команды и устройство базы описаны в [infra/postgres/README.md](infra/postgres/README.md).

Проверки:

```bash
npm run check
npm test
npm run build
```

## Визуальный прототип

```bash
npm run prototype:dev
```

Прототип открывается на `http://127.0.0.1:4173` и используется для визуального сравнения production-экранов.
