# next-web

Personal monorepo: portfolio site + **LuvVerse** couple platform (web & Flutter mobile).

## What's in here

| Module | Stack | Path |
|--------|-------|------|
| **LuvVerse (Web)** | Next.js 15, styled-components, Prisma, Auth.js | `app/couple/` |
| **LuvVerse (Mobile)** | Flutter 3, Riverpod, Drift, go_router | `mobile_flutter/` |
| **Portfolio** | Next.js, SCSS + Tailwind, Redux | `app/profile/`, `app/profile-2.0/` |
| **API** | Next.js Route Handlers, Prisma, JWT | `app/api/v1/` |
| **Admin** | Next.js, SCSS | `app/admin/` |
| **Tools** | Next.js, styled-components | `app/tools/` |

## LuvVerse — Everyday for the couple

A couple-focused lifestyle platform with pillars:

- **Finance** — accounts, transactions, budgets, loans, goals, receipt scanning (AI)
- **Lifestyle** — shared activities, habits
- **Travel** — trip planning, itineraries
- **Chat** — private messaging with shared lists

Both partners see the same data via couple data sharing. Invite-based onboarding with token system.

## Quick Start

### Web (Next.js)

```bash
npm install
npm run dev          # http://localhost:3737
```

### Mobile (Flutter)

```bash
cd mobile_flutter
flutter pub get
flutter run          # Android or iOS
```

### Database

```bash
npx prisma migrate dev --name <name>   # New migration
npx prisma studio                       # DB browser
```

## Tech Stack

- **Next.js 15.3** — App Router, Server Components, Server Actions
- **TypeScript 5** — strict mode
- **Prisma v7** — PostgreSQL (Prisma Postgres)
- **Auth.js v5** — Google OAuth, JWT
- **Flutter 3** — Riverpod, freezed, go_router
- **Gemini 2.0 Flash** — AI receipt scanning, financial insights
- **Vercel** — deployment (pranesh.link)
- **Firebase App Distribution** — mobile beta testing

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 3737) |
| `npm run build` | Production build (Prisma migrate + Next.js) |
| `npm test` | Jest tests |
| `npm run test:coverage` | Tests with coverage report |

## Deployment

- **Web**: Vercel auto-deploys from `master` → pranesh.link
- **Mobile**: GitHub Actions → Firebase App Distribution

## License

Private repository.
