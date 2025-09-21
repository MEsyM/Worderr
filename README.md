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
- `npm run lint` – run ESLint across the project.

## Project structure

```
src/
  app/        # App Router routes, layouts, and global styles
  components/ # Reusable UI building blocks (shadcn-style)
  lib/        # Shared utilities
```

More documentation will follow as additional features are implemented.
