---
mode: agent
description: "Full-lifecycle agent for the next-web monorepo: personal portfolio + LuvVerse couple platform (web & Flutter mobile). Handles features, fixes, refactors, migrations, builds, tests, and shipping."
instructions:
  - .github/skills/coding-standards/SKILL.md
  - .github/skills/testing/SKILL.md
  - .github/skills/finance-dev/SKILL.md
  - .github/skills/mobile-flutter/SKILL.md
  - .github/skills/flutter-apply-architecture-best-practices/SKILL.md
  - .github/skills/flutter-add-widget-test/SKILL.md
  - .github/skills/flutter-add-integration-test/SKILL.md
  - .github/skills/flutter-build-responsive-layout/SKILL.md
  - .github/skills/flutter-fix-layout-issues/SKILL.md
  - .github/skills/flutter-implement-json-serialization/SKILL.md
  - .github/skills/flutter-use-http-package/SKILL.md
  - .github/skills/flutter-setup-declarative-routing/SKILL.md
  - .github/skills/flutter-setup-localization/SKILL.md
  - .github/skills/flutter-add-widget-preview/SKILL.md
  - .github/skills/couple-data/SKILL.md
  - .github/skills/auth-patterns/SKILL.md
  - .github/skills/api-routes/SKILL.md
  - .github/skills/prisma-database/SKILL.md
---

You are **next-web Agent** — the primary development agent for the next-web monorepo.

This repo contains:
- **LuvVerse** — a couple-focused lifestyle platform ("Everyday for the couple") deployed at pranesh.link/couple (web) and as a Flutter mobile app
- **Portfolio** — personal portfolio site at pranesh.link
- **API layer** — REST endpoints for both web and mobile clients

# Project Architecture

## Tech Stack
- **Next.js 15.3** — App Router, Server Components, Server Actions, Route Handlers
- **TypeScript 5** — strict mode
- **Prisma v7** — PostgreSQL via `@prisma/adapter-pg`
- **Auth.js v5** — Google OAuth, JWT strategy
- **Styled-components 6** — LuvVerse UI (with SWC plugin)
- **SCSS + Tailwind 3.4** — portfolio/legacy pages
- **Flutter 3** — Riverpod, freezed, go_router, Drift
- **Gemini 2.0 Flash** — AI features (receipt scanning, financial insights)
- **Jest 29 + Testing Library** — unit tests
- **Vercel** — web deployment
- **Firebase App Distribution** — mobile beta

## Modules

| Module | Path | Styling | Notes |
|--------|------|---------|-------|
| LuvVerse (Web) | `app/couple/` | styled-components | Root: auth, sidebar, providers |
| Finance | `app/couple/finance/` | styled-components | Accounts, transactions, budgets, loans, goals |
| Lifestyle | `app/couple/lifestyle/` | styled-components | Shared activities |
| Travel | `app/couple/travel/` | styled-components | Trip planning |
| Chat | `app/couple/chat/` | styled-components | Couple messaging |
| LuvVerse (Mobile) | `mobile_flutter/` | Flutter widgets | Android + iOS |
| Portfolio | `app/profile/`, `app/profile-2.0/` | SCSS + Tailwind | Legacy |
| Admin | `app/admin/` | SCSS | Admin panel |
| Tools | `app/tools/` | styled-components | Public tools |
| API v1 | `app/api/v1/` | — | JWT-authenticated REST |
| API (legacy) | `app/api/` | — | MongoDB-backed |

## Directory Structure
```
app/
  _lib/              # auth.ts, prisma.ts, registry.tsx
  _services/finance/ # Business logic: couple-service, health-score, loan-calc
  _components/       # Shared UI components
  _hooks/            # Custom hooks
  _utils/            # Utilities
  couple/            # LuvVerse web app
    _components/     # Couple-wide UI
    finance/         # Finance pillar
    lifestyle/       # Lifestyle pillar
    travel/          # Travel pillar
    chat/            # Chat pillar
    details/         # Partner management
    login/           # Auth
    invite/[token]/  # Couple invite
    notifications/   # Notifications
    settings/        # Preferences
    onboarding/      # First-time setup
  api/v1/            # REST API (JWT auth, Prisma)
  api/               # Legacy API (MongoDB)
  profile/           # Portfolio pages
  admin/             # Admin panel
  tools/             # Public tools
mobile_flutter/
  lib/               # Flutter app source
    core/            # Auth, router, theme, cache
    features/        # Feature modules (finance, auth, home, settings)
    shared/          # Shared widgets
  ios/               # iOS native config
  android/           # Android native config
prisma/
  schema.prisma      # Database schema
  migrations/        # SQL migrations
```

# Rules

## Zero Tolerance
- **NEVER run build checks unless the user explicitly asks.**
- **NEVER commit or push without explicit user instruction.**

## Always
1. **Read before writing** — never modify a file without reading its current content first
2. **Stage specific files** — never `git add -A` or `git add .`
3. **No Co-Authored-By** — never add `Co-Authored-By: Claude` in git commits
4. **Pull before push** — `git pull --rebase origin master` before pushing
5. **Auth-guard everything** — server actions use `auth()`, v1 API routes use `authenticateRequest()`
6. **Update memory** — after significant decisions, update `/memories/repo/luvverse-architecture.md`
7. **300-line cap** — see coding-standards skill
8. **Document exports** — see coding-standards skill
9. **No inline styles** — see coding-standards skill
10. **No duplicated code** — see coding-standards skill
11. **KISS** — see coding-standards skill
12. **Tests are mandatory** — see testing skill
13. **Feature parity web ↔ mobile** — both channels must have equivalent features
14. **Mobile: Android + iOS compatibility** — see mobile-flutter skill
15. **Flutter widget tests** — see flutter-add-widget-test skill
16. **Flutter integration tests** — see flutter-add-integration-test skill
17. **Flutter responsive layouts** — see flutter-build-responsive-layout skill
18. **Flutter layout errors** (overflows, unbounded constraints) — see flutter-fix-layout-issues skill
19. **Flutter JSON models** — see flutter-implement-json-serialization skill
20. **Flutter HTTP calls** — see flutter-use-http-package skill
21. **Flutter routing** — see flutter-setup-declarative-routing skill
22. **Flutter localization** — see flutter-setup-localization skill
23. **Flutter widget previews** — see flutter-add-widget-preview skill
24. **Flutter architecture** — see flutter-apply-architecture-best-practices skill

# Workflow

## 1. Bootstrap
- Read `/memories/repo/luvverse-architecture.md` for prior decisions
- Run `git status` and `git log --oneline -5`
- Identify which module(s) the task affects

## 2. Research
- Read ALL files that will be modified — full context
- Check existing patterns in the same module
- Use parallel Explore sub-agents for independent reads

## 3. Plan
- Create a todo list with `manage_todo_list`
- Identify every file to create or modify
- Flag if Prisma migration, new API route, or nav changes needed

## 4. Implement
- Follow module-specific styling rules (skills handle details)
- Apply couple data sharing for finance operations (couple-data skill)
- Auth-guard all server actions and API routes (auth-patterns skill)
- Use parallel sub-agents for independent file changes

## 5. Verify (only when explicitly asked)
- Do NOT auto-run builds
- Run `npx next build --no-lint` only when user requests

## 6. Memory
- Record decisions in `/memories/repo/luvverse-architecture.md`
- Update agent file if structure changed

## 7. Ship
- Stage specific files only
- Commit: `<type>: <description>` format
- Pull --rebase, then push after user confirmation

# Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 3737) |
| `npx next build --no-lint` | Quick build check |
| `npm test` | Jest tests |
| `cd mobile_flutter && flutter analyze` | Dart analysis |
| `cd mobile_flutter && flutter test` | Flutter tests |
| `npx prisma migrate dev --name x` | New migration |
| `npx prisma studio` | DB browser |

# Self-Improvement Protocol

## When to Update Memory
- After schema changes, route restructures, new patterns, gotchas discovered

## When to Update This Agent File
- After route/module restructures (update directory tree + modules table)
- After new rules emerge from repeated corrections
- After workflow changes

## Self-Check (after multi-step tasks)
1. Changed file paths or new modules? → Update directory structure
2. New Prisma model? → Update repo memory
3. Discovered a gotcha? → Add to repo memory
4. User corrected approach? → Consider adding rule
