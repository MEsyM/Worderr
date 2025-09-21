# LingvoJam

Initial scaffolding for the LingvoJam collaborative wordplay platform. This project currently includes:

- Next.js 15 App Router with TypeScript and SSR-ready defaults.
- Tailwind CSS v3 configured with a shadcn/ui design token setup.
- A starter UI kit (button component) wired through the shadcn-style utilities.
- Prisma ORM models and migrations targeting PostgreSQL.
- NextAuth authentication configured for email magic links with Prisma as the adapter.
- Docker tooling for a containerised development stack (app + PostgreSQL).

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The application will be available at http://localhost:3000.

### Run with Docker Compose

1. Copy the environment template and update the values as needed:

   ```bash
   cp .env.example .env
   ```

2. Start the stack (Next.js app + PostgreSQL) with a single command:

   ```bash
   docker compose up --build
   ```

   The application runs on http://localhost:3000 and the database listens on port 5432.

3. Stop the stack with `docker compose down`. Data persists in the `postgres-data` volume unless removed.

## Environment configuration

`/.env.example` documents the required variables:

| Variable                                      | Description                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `NEXTAUTH_URL`                                | Base URL of the Next.js application, used by NextAuth when constructing callback links.                       |
| `NEXTAUTH_SECRET`                             | Secret used to sign and encrypt NextAuth tokens. Generate a strong value in production.                       |
| `DATABASE_URL`                                | PostgreSQL connection string consumed by Prisma and the app. The example targets the bundled Docker database. |
| `EMAIL_SERVER_HOST` / `EMAIL_SERVER_PORT`     | SMTP host and port used for sending magic link emails.                                                        |
| `EMAIL_SERVER_USER` / `EMAIL_SERVER_PASSWORD` | SMTP credentials for the email provider.                                                                      |
| `EMAIL_FROM`                                  | The email address (optionally with display name) that delivers sign-in links.                                 |
| `SOCKET_IO_SERVER_URL`                        | Base URL for the Socket.IO server powering real-time collaboration.                                           |
| `SOCKET_IO_CLIENT_PATH`                       | Socket.IO path configuration shared between client and server.                                                |

## Database tasks

Prisma manages the PostgreSQL schema defined in `prisma/schema.prisma`.

- Apply migrations: `npm run db:migrate`
- Push the schema during development (non-destructive): `npm run db:push`
- Seed demo data: `npm run db:seed`

The seed script inserts sample users, a room, a turn with votes, and summaries for local development.

## Available scripts

- `npm run dev` – start the Next.js development server with Turbopack.
- `npm run build` – produce a production build.
- `npm run start` – run the production build.
- `npm run lint` – run ESLint across the project.
- `npm run db:migrate` – run pending Prisma migrations against the configured database.
- `npm run db:push` – push the Prisma schema to the database without generating migrations.
- `npm run db:seed` – execute the Prisma seed script for demo data.

## Project structure

```
src/
  app/        # App Router routes, layouts, and global styles
  components/ # Reusable UI building blocks (shadcn-style)
  lib/        # Shared utilities
```

More documentation will follow as additional features are implemented.
