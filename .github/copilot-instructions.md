# Copilot Instructions — Coupletastic

## Project Overview
Coupletastic is a couple-focused personal finance app built with Next.js 15 (App Router), Prisma v7, Auth.js v5, styled-components, and deployed on Vercel.

## Tech Stack
- **Next.js 15.3.8** — App Router, Server Actions, API routes
- **Prisma v7.5** — PostgreSQL via `@prisma/adapter-pg`
- **Auth.js v5** — Google OAuth, JWT sessions
- **Styled-components 6** — All finance UI components
- **Recharts 3** — Chart visualizations
- **Zod 4** — Validation
- **Gemini 2.0 Flash** — AI features (receipt scanning, insights)

## Architecture Rules

### Server Actions (`app/finance/_actions/`)
- All finance CRUD goes through server actions, not API routes
- Always use `"use server"` directive
- Always call `auth()` and validate session before any DB operation
- For couple-shared data: use `getUserIdsForCouple(userId)` for reads, `getCoupleIdForUser(userId)` for creates

### REST API (`app/api/v1/finance/`)
- JWT-authenticated external API (not session-based)
- Use `authenticateRequest()` from `@/api/v1/_lib/auth`
- Same couple-sharing pattern as server actions

### Couple Data Sharing Pattern
```typescript
// Reads — query both couple members
const coupleUserIds = await getUserIdsForCouple(userId);
where: { userId: { in: coupleUserIds } }

// Creates — tag with coupleId
const coupleId = await getCoupleIdForUser(userId);
data: { ...fields, userId, ...(coupleId ? { coupleId } : {}) }

// Update/Delete — accept any couple member as owner
where: { id, userId: { in: coupleUserIds } }
```

### Styling
- Use `styled-components` for all finance pages (never plain CSS or Tailwind for new finance code)
- Theme via CSS variables from `FinanceThemeProvider`
- Use `var(--text)`, `var(--bg-elevated)`, `var(--border)`, `var(--accent)`, etc.
- Mobile-first: always handle `@media (max-width: 768px)` and `@media (max-width: 480px)`

### Database
- All finance models (FinancialAccount, Transaction, Budget, Loan, SavingsGoal) have optional `coupleId`
- CoupleMember roles: `"OWNER"` (group creator) and `"PARTNER"`
- Prisma migrations in `prisma/migrations/`

### Build & Quality
- `npx next build --no-lint` for quick verification
- `npm run build` runs prisma migrate + full build
- Always verify build passes before pushing
- Dev server: `npm run dev` (port 3737)

### Git Conventions
- No `Co-Authored-By: Claude` lines in commits
- Stage specific files only — never `git add -A` or `git add .`
- Commit format: `<type>: <description>` (feat, fix, refactor, chore, test, docs)
- Always pull --rebase before push

### Deployment
- Vercel auto-deploys from master branch
- Domain: pranesh.link
- Long-running API routes need `export const maxDuration = 60`
- PWA via @ducanh2912/next-pwa
