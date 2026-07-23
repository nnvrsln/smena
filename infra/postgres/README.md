# Локальный PostgreSQL

Для разработки используется официальный бинарный архив PostgreSQL 18.4 для Windows. Он распакован в `.tools/`, не попадает в Git и не устанавливает службу Windows.

Текущая локальная база:

- адрес: `127.0.0.1:55432`;
- база: `smena_dev`;
- прикладная роль: `smena_app`;
- строка подключения хранится в корневом `.env`;
- схема: `001_foundation.sql`;
- контролируемые dev-данные: `002_development_seed.sql`;
- пароли и серверные сессии: `003_auth_sessions.sql`.

Ежедневные команды из корня проекта:

```powershell
npm run db:start
npm run db:status
npm run db:stop
```

Миграции для development, test, staging и production применяются одной командой:

```powershell
npm run db:migrate
```

Среда определяется `APP_ENV`. Файл `002_development_seed.sql` применяется только в development и test. Применённые миграции записываются в `smena_schema_migrations` с checksum и повторно не выполняются.

Резервное копирование и безопасное тестовое восстановление описаны в `docs/STAGING_RUNBOOK.md`.

`.tools/` можно удалить без потери исходного кода, но локальная база и скачанный PostgreSQL тогда потребуют повторной подготовки.
