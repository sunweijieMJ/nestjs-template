# Installation

NestJS Boilerplate uses [TypeORM](https://www.npmjs.com/package/typeorm) with [PostgreSQL](https://www.postgresql.org/) as the database solution. You can also use MySQL or other TypeORM-supported databases.

---

## Table of Contents <!-- omit in toc -->

- [Comfortable development (PostgreSQL + TypeORM)](#comfortable-development-postgresql--typeorm)
  - [Video guideline (PostgreSQL + TypeORM)](#video-guideline-postgresql--typeorm)
- [Quick run (PostgreSQL + TypeORM)](#quick-run-postgresql--typeorm)
- [Links](#links)

---

## Comfortable development (PostgreSQL + TypeORM)

1. Clone repository

   ```bash
   git clone --depth 1 https://github.com/brocoders/nestjs-boilerplate.git my-app
   ```

1. Go to folder, and copy `env-example-relational` as `.env`.

   ```bash
   cd my-app/
   cp env-example-relational .env
   ```

1. Change `DATABASE_HOST=postgres` to `DATABASE_HOST=localhost`

   Change `MAIL_HOST=maildev` to `MAIL_HOST=localhost`

   Change `REDIS_HOST=redis` to `REDIS_HOST=localhost`

1. Run additional container:

   ```bash
   make -C docker infra
   ```

1. Install dependency

   ```bash
   pnpm install
   ```

1. Run migrations

   ```bash
   pnpm migration:run
   ```

1. Run seeds

   ```bash
   pnpm seed:run:relational
   ```

1. Run app in dev mode

   ```bash
   pnpm start:dev
   ```

1. Open <http://localhost:3000>

### Video guideline (PostgreSQL + TypeORM)

<https://github.com/user-attachments/assets/136a16aa-f94a-4b20-8eaf-6b4262964315>

---

## Quick run (PostgreSQL + TypeORM)

If you want quick run your app, you can use following commands:

1. Clone repository

   ```bash
   git clone --depth 1 https://github.com/brocoders/nestjs-boilerplate.git my-app
   ```

1. Go to folder. The containers read configuration from `env-example-relational`, edit it if you need to change settings.

   ```bash
   cd my-app/
   ```

1. Run containers. Logs are streamed to the terminal; press `Ctrl+C` and run `make -C docker down` to stop.

   ```bash
   make -C docker dev
   ```

1. Open <http://localhost:3000>

---

## Links

- Swagger (API docs): <http://localhost:3000/docs>
- Adminer (client for DB): <http://localhost:8080>
- Maildev: <http://localhost:1080>

---

Previous: [Introduction](introduction.md)

Next: [Architecture](architecture.md)
