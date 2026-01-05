# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains Next.js App Router files like `layout.tsx`, `page.tsx`, and `globals.css`.
- `components/` holds page sections; `components/ui/` contains shadcn/ui primitives.
- `hooks/` stores shared React hooks.
- `lib/` includes utilities (see `lib/utils.ts`).
- `public/` contains static assets (images, icons).
- `styles/` is reserved for additional global CSS if referenced.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint across the repo.
- Use `npm` or `pnpm`, but keep lockfiles in sync with the chosen package manager.

## Coding Style & Naming Conventions
- TypeScript + React; export components in PascalCase.
- Files in `components/` are named by feature (e.g., `hero.tsx`, `footer.tsx`).
- Use 2-space indentation, no semicolons, and double quotes as in existing files.
- Tailwind CSS utilities are preferred; global styles live in `app/globals.css`.
- Use path aliases like `@/components/...` and `@/lib/...` (see `tsconfig.json`).

## Testing Guidelines
- No test framework or `test` script is configured yet.
- If adding tests, use `*.test.ts(x)` or `*.spec.ts(x)` and add a matching script in `package.json`.

## Commit & Pull Request Guidelines
- Solo workflow: keep it lightweight and flexible.
- Commit messages are free-form, but prefer short, descriptive subjects (e.g., "Tweak hero CTA spacing").
- If using PRs, add a brief summary and include screenshots/GIFs for UI changes.

## Configuration & Assets
- Reference assets from `public/` with root paths like `/placeholder.jpg`.
- Store new environment variables in `.env.local` and document their usage.
