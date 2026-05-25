---
name: couple-data
description: "Couple data sharing patterns for LuvVerse. All financial queries must be couple-aware: reads expand to both members, creates tag with coupleId, updates verify couple-wide ownership."
applyTo: "app/couple/finance/_actions/**"
---

# Couple Data Sharing

## Absolute Rule
ALL financial queries MUST support couple data sharing. Single-user-only queries are a bug.

## Pattern

```typescript
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";

// READS — expand to both couple members
const coupleUserIds = await getUserIdsForCouple(userId);
prisma.model.findMany({ where: { userId: { in: coupleUserIds } } });

// CREATES — tag with coupleId
const coupleId = await getCoupleIdForUser(userId);
prisma.model.create({ data: { ...fields, userId, ...(coupleId ? { coupleId } : {}) } });

// UPDATE / DELETE — couple-wide ownership check
prisma.model.findFirst({ where: { id, userId: { in: coupleUserIds } } });
```

## Models with Couple Support
All finance models have `coupleId String?`:
- FinancialAccount
- Transaction
- Budget
- Loan
- SavingsGoal

## Couple Models
- **Couple**: group entity
- **CoupleMember**: roles `OWNER` ("Group Creator") and `PARTNER`
- **CoupleInvite**: token-based invitation system

## Service Functions
Located in `app/_services/finance/couple-service.ts`:
- `getUserIdsForCouple(userId)` — returns array of user IDs in the couple (or just [userId] if solo)
- `getCoupleIdForUser(userId)` — returns coupleId or null
- `getCoupleForUser(userId)` — returns full couple with members

## When Creating New Models
Required fields:
```prisma
model NewThing {
  id        String   @id @default(cuid())
  userId    String
  coupleId  String?
  // ... other fields
  @@index([userId])
  @@map("new_things")
}
```
