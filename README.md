# LingvoJam

LingvoJam is a collaborative wordplay platform built with Next.js 15, Prisma, and NextAuth. It combines synchronous writing tools with real-time collaboration primitives to help storytellers create lyrical narratives together.

## Core functionality

- **Account management** – Visitors can create an account with their name, email address, and password through the `/register` page. The API stores a bcrypt-hashed password and prevents duplicate registrations. Existing users sign in via the `/login` page using credentials-based authentication backed by NextAuth sessions. Magic-link email auth remains available for teams that prefer passwordless entry.
- **Session-aware navigation** – The global layout surfaces contextual actions (register, log in, sign out) and keeps the active session available to both client and server components through shared providers. Authenticated users see their profile avatar and can end their session with a single click.
- **Room creation workflow** – Authenticated hosts can publish new jam rooms from the dashboard form. The UI guides them through selecting a mode (solo or crew), configuring rule presets (max words, sentences, forbidden vocabulary, rhyme target), and supplies inline toasts for success or failure states. Anonymous visitors are prompted to register or log in before the form becomes interactive.
- **Real-time collaboration scaffold** – Socket.IO namespaces back each room, broadcasting lifecycle events such as participants joining, timer state changes, and lyrical turn submissions. Server-side guards ensure socket metadata includes the signed-in user identity so crews can attribute contributions in live sessions.
- **Prisma-backed persistence** – The PostgreSQL schema tracks users, rooms, invitations, and lyrical turns. Migrations, seeds, and runtime access all go through Prisma, ensuring a consistent data contract between the API routes and collaboration services.

## Table of contents

- [Architecture overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Project setup](#project-setup)
- [Environment variables](#environment-variables)
- [Database & migrations](#database--migrations)
- [Local development workflow](#local-development-workflow)
- [Running with Docker](#running-with-docker)
- [Testing & quality assurance](#testing--quality-assurance)
- [Deployment guides](#deployment-guides)
  - [Vercel](#vercel)
  - [Render](#render)
- [Operational roles](#operational-roles)
- [Additional npm scripts](#additional-npm-scripts)

## Architecture overview

- **Web application**: Next.js App Router project (`src/app`) rendered with React 19 and Tailwind CSS.
- **Authentication**: NextAuth with the Prisma adapter, supporting both credential-based logins and email magic-link flows.
- **Database**: PostgreSQL schema managed by Prisma migrations and seed data.
- **Real-time transport**: Socket.IO configuration shared between the server and client.
- **UI toolkit**: shadcn-inspired components that rely on Tailwind utility tokens.

## Prerequisites

- Node.js **>= 18.18** (matches the Next.js 15 engine requirement).
- npm **>= 9**.
- Docker Desktop (optional, required only if using the Docker Compose workflow).

## Project setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file and customise the values:
   ```bash
   cp .env.example .env
   ```
3. Generate the Prisma client and apply the latest database schema in development:
   ```bash
   npx prisma generate
   npm run db:push
   ```
4. Seed the database with demo content (optional but recommended for first-time users):
   ```bash
   npm run db:seed
   ```

## Environment variables

The `.env.example` file documents every required variable. Update the placeholders with project-specific values before running the app in any environment.

| Variable                                      | Description                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `NEXTAUTH_URL`                                | Public base URL of the application. Use `http://localhost:3000` for local development. |
| `NEXTAUTH_SECRET`                             | Random string used to sign NextAuth tokens. Generate with `openssl rand -base64 32`.   |
| `DATABASE_URL`                                | PostgreSQL connection string consumed by Prisma and the application runtime.           |
| `EMAIL_SERVER_HOST` / `EMAIL_SERVER_PORT`     | SMTP host and port for sending magic-link emails.                                      |
| `EMAIL_SERVER_USER` / `EMAIL_SERVER_PASSWORD` | Credentials for the configured SMTP provider.                                          |
| `EMAIL_FROM`                                  | Email address (optionally with a display name) that issues authentication emails.      |
| `SOCKET_IO_SERVER_URL`                        | Base URL for the Socket.IO server used for collaborative updates.                      |
| `SOCKET_IO_CLIENT_PATH`                       | Socket.IO path shared by the server and client.                                        |

> **Tip:** commit the `.env.example` file but never commit the populated `.env` file.

## Database & migrations

The Prisma schema lives in `prisma/schema.prisma`.

- Apply migration history in production-like environments:
  ```bash
  npm run db:migrate
  ```
- Push incremental changes to the database during development (non-destructive):
  ```bash
  npm run db:push
  ```
- Run the seed script to insert demo users, rooms, and sample turns:
  ```bash
  npm run db:seed
  ```

For local PostgreSQL, Docker Compose provisions the service with credentials that match the defaults in `.env.example`.

## Local development workflow

1. Ensure your `.env` file is configured.
2. Start the Next.js development server with Turbopack:
   ```bash
   npm run dev
   ```
   The app is available at http://localhost:3000.
3. Keep Prisma in sync whenever schema changes occur:
   ```bash
   npx prisma migrate dev --name <migration-name>
   ```
4. Run unit tests and lint checks frequently (see [Testing & quality assurance](#testing--quality-assurance)).

## Running with Docker

The repository ships with `Dockerfile` and `docker-compose.yml` files for an all-in-one development stack.

1. Create a `.env` file as described above. The defaults target the Docker network.
2. Build and start the containers:

   ```bash
   docker compose up --build
   ```

   - `web`: Next.js application running on port 3000.
   - `db`: PostgreSQL instance exposed on port 5432 with a named volume (`postgres-data`).

3. Apply migrations inside the running web container if needed:
   ```bash
   docker compose exec web npm run db:migrate
   ```
4. Tear down the stack when finished:
   ```bash
   docker compose down
   ```
   The database volume persists between runs unless removed with `docker volume rm postgres-data`.

## Testing & quality assurance

Vitest provides the unit-testing harness for utility and validation logic.

- Run the full test suite:
  ```bash
  npm test
  ```
- Generate coverage locally (produces text summary and `coverage/` HTML report):
  ```bash
  npx vitest run --coverage
  ```
- Lint the codebase before opening pull requests:
  ```bash
  npm run lint
  ```

Continuous integration should include the commands above to protect critical flows such as text sanitisation, rhyme heuristics, and turn validation.

## Deployment guides

LingvoJam can be deployed to any platform that supports Next.js 15. Below are baseline steps for two common targets.

### Vercel

1. Create a new Vercel project and import this Git repository.
2. Set the environment variables in the Vercel dashboard (use the same keys defined in `.env.example`).
3. Add a PostgreSQL database (Vercel Postgres or an external provider) and update `DATABASE_URL` accordingly.
4. Configure a production build command (`npm run build`) and output directory (`.next`).
5. After the first successful deployment, run Prisma migrations via a Vercel deployment hook or locally against the production database using `npm run db:migrate`.

### Render

1. Provision a **Web Service** in Render pointing to this repository. Use the build command `npm install && npm run build` and start command `npm run start`.
2. Add a managed PostgreSQL instance in Render and copy its connection string into the `DATABASE_URL` environment variable.
3. Define all other environment variables on the service settings page.
4. Run migrations by opening a shell in the service or by creating a temporary job that executes `npm run db:migrate`.
5. Ensure the web service has at least 512 MB of RAM for Next.js and Prisma.

## Operational roles

Successful delivery of LingvoJam involves several collaborating roles:

- **Product & Design** – define collaborative wordplay experiences, interaction flows, and accessibility guidelines.
- **Frontend Engineering** – implement Next.js routes, shared UI components, and real-time client behaviour.
- **Backend Engineering** – maintain Prisma schema, authentication flows, email delivery, and Socket.IO services.
- **Quality Assurance** – expand Vitest coverage, validate user stories end-to-end, and monitor bug reports.
- **DevOps / Platform** – manage environment variables, database lifecycle, Docker infrastructure, and deployment pipelines.

Establish regular hand-offs between these roles to keep schema changes, UI updates, and QA scenarios in sync.

## Additional npm scripts

- `npm run build` – build a production bundle with Turbopack.
- `npm run start` – serve the production build.
- `npm run lint` – execute ESLint with zero-warning tolerance.
- `npm run db:migrate` – apply pending migrations.
- `npm run db:push` – synchronise the schema without generating migrations.
- `npm run db:seed` – populate the database with demo data.

Future updates will expand this documentation as new features land.
