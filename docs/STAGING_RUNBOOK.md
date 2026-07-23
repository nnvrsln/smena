# Staging runbook

## 1. Конфигурация

1. Скопировать `.env.staging.example` в защищённое хранилище конфигурации staging.
2. Заменить `WEB_ORIGIN` и `DATABASE_URL` реальными значениями.
3. Не сохранять итоговый `.env` в Git, CI-артефакты или логи.
4. PostgreSQL должен быть доступен только API и административному контуру.

## 2. Развёртывание

```powershell
npm ci
npm run db:migrate:verify
npm run db:migrate
npm run check
npm test
npm run build
npm run db:restore:verify
npm run start -w @smena/api
```

Повторный `npm run db:migrate` должен пропустить уже применённые файлы. Изменение применённого SQL останавливает миграцию по несовпадению checksum.

`db:migrate:verify` по умолчанию проверяет миграции в пустой временной схеме с правами прикладной роли. В CI оператор передаёт отдельный `MIGRATION_ADMIN_URL`, и проверка выполняется в отдельной временной БД. Административный URL не передаётся runtime API.

`db:restore:verify` создаёт backup текущей тестовой БД, восстанавливает его только в `smena_restore_test`, проверяет контрольные данные, повторяет API-тесты на восстановленном контуре и удаляет временную БД и dump. Команда требует отдельный `MIGRATION_ADMIN_URL`.

## 3. Проверка готовности

Запрос `GET /health` должен вернуть HTTP 200 и:

```json
{"status":"ok","service":"smena-api","checks":{"api":"ok","postgres":"ok"}}
```

Недоступный PostgreSQL возвращает HTTP 503. Ответы об ошибках содержат `requestId`; такой же идентификатор присутствует в JSON-логе завершённого или упавшего запроса.

Логи не должны содержать `Cookie`, пароль, session token или полную строку `DATABASE_URL`.

## 4. Резервная копия

```powershell
npm run db:backup -- tmp/backups/staging.dump
```

Команда использует `DATABASE_URL`. Пароль передаётся `pg_dump` через переменную дочернего процесса, а не аргумент командной строки.

## 5. Тестовое восстановление

Сначала создать отдельную пустую базу с именем, оканчивающимся на `_restore_test`, и выдать оператору права только на неё.

```powershell
$env:RESTORE_DATABASE_URL='postgresql://restore_operator:secret@postgres:5432/smena_restore_test'
npm run db:restore:test -- tmp/backups/staging.dump
```

После восстановления временно направить `DATABASE_URL` на эту базу и выполнить `npm test`. Тест tenant isolation обязан пройти. Тестовую базу удаляет оператор после фиксации результата проверки.

Восстановление в базу с другим именем заблокировано. Аварийное снятие защиты через `SMENA_ALLOW_RESTORE=1` допускается только по отдельному решению ответственного за production.

## 6. Диагностика

- CI не проходит миграции: проверить порядок файлов и checksum, не редактировать уже применённый SQL;
- `/health` возвращает 503: проверить DNS, порт, TLS и права прикладной роли PostgreSQL;
- API возвращает `INTERNAL_ERROR`: найти JSON-лог по `requestId`;
- сборка web не проходит: повторить `npm ci`, `npm run check`, затем `npm run build` на том же commit SHA;
- tenant isolation не проходит: остановить развёртывание, не использовать контур с реальными данными.
