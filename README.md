# LingvoJam

Initial scaffolding for the LingvoJam collaborative wordplay platform. This project currently includes:

- Next.js 15 App Router with TypeScript and SSR-ready defaults.
- Tailwind CSS v3 configured with a shadcn/ui design token setup.
- A starter UI kit (button component) wired through the shadcn-style utilities.

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The application will be available at http://localhost:3000.

## Available scripts

- `npm run dev` – start the Next.js development server with Turbopack.
- `npm run build` – produce a production build.
- `npm run start` – run the production build.
- `npm run lint` – run ESLint with zero-warning enforcement.
- `npm run lint:fix` – automatically fix lint issues where possible.
- `npm run format` – apply Prettier formatting (includes Tailwind class sorting).
- `npm run format:check` – check formatting without writing changes.
- `npm run test` – run Vitest in watch mode.
- `npm run test:run` – run Vitest once in CI mode.
- `npm run lint-staged` – execute the staged-file checks that the Husky pre-commit hook uses.

## Project structure

```
src/
  app/        # App Router routes, layouts, and global styles
  components/ # Reusable UI building blocks (shadcn-style)
  lib/        # Shared utilities
```

More documentation will follow as additional features are implemented.

## Code quality tooling

- **ESLint** is configured via the flat config API with the Next.js and Prettier presets.
- **Prettier** uses `prettier-plugin-tailwindcss` so utility classes stay sorted automatically.
- **Vitest** provides a lightweight unit testing harness for upcoming domain utilities.
- **Husky + lint-staged** run linting and formatting checks on staged files before every commit.
