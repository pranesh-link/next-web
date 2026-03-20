---
name: finance-dev
description: "Develop features in the Coupletastic finance module (app/finance/). Covers styled-components UI, server actions, couple data sharing, auth patterns, receipt scanning, budgets, loans, goals, transactions, and accounts. Use when building or modifying any finance page or component."
---

# Finance Module Development

## Module Location
All finance code lives under `app/finance/`. Server actions are in `app/finance/_actions/`. Components are in `app/finance/_components/`.

## Styling — styled-components ONLY
- Use `styled-components` exclusively — no Tailwind, no plain CSS, no CSS modules
- Theme via CSS variables defined in `app/finance/_components/theme/`:
  - `--text`, `--text-muted`, `--bg`, `--bg-elevated`, `--surface`, `--border`, `--accent`, `--danger`
- Mobile-first responsive: always handle `@media (max-width: 768px)` and `@media (max-width: 480px)`
- Prevent horizontal scroll: `overflow-x: hidden` on containers, `min-width: 0` on flex children
- Sidebar layout: 64px collapsed, 256px expanded; main content `margin-left: 64px`

## Server Actions Pattern
All server actions in `app/finance/_actions/` follow this structure:
```typescript
"use server";
import { auth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";

export async function myAction(data: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  // READS — expand to couple members
  const coupleUserIds = await getUserIdsForCouple(userId);
  const records = await prisma.model.findMany({
    where: { userId: { in: coupleUserIds } },
  });

  // CREATES — tag with coupleId
  const coupleId = await getCoupleIdForUser(userId);
  await prisma.model.create({
    data: { ...fields, userId, ...(coupleId ? { coupleId } : {}) },
  });
}
```

## Auth
- Server-side: `const session = await auth()` from `@/_lib/auth`
- Client sign-out: `signOut()` from `next-auth/react` with confirmation modal
- Never redirect to `/api/auth/signout` directly

## Finance Pages
| Page | Path | Actions File |
|------|------|-------------|
| Dashboard | `app/finance/page.tsx` | `_actions/dashboard.ts` |
| Transactions | `app/finance/transactions/page.tsx` | `_actions/transactions.ts` |
| Budgets | `app/finance/budgets/page.tsx` | `_actions/budgets.ts` |
| Loans | `app/finance/loans/page.tsx` | `_actions/loans.ts` |
| Goals | `app/finance/goals/page.tsx` | `_actions/goals.ts` |
| Couple | `app/finance/couple/page.tsx` | `_actions/couples.ts` |
| Accounts | (settings/modal) | `_actions/accounts.ts` |

## Receipt Scanning
- Uses Gemini 2.0 Flash via `app/finance/_actions/insights.ts`
- MIME types must include `image/heif` for iOS
- Route needs `export const maxDuration = 60` for long-running AI calls

## Key Services
- `app/_services/finance/couple-service.ts` — `getUserIdsForCouple()`, `getCoupleIdForUser()`
- `app/_services/finance/health-score.ts` — Financial health scoring
- `app/_services/finance/loan-calculator.ts` — Amortization calculations
