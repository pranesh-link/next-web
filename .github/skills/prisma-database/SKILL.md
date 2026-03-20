---
name: prisma-database
description: "Manage Prisma schema, migrations, and database operations for the next-web project. Use when creating or modifying database models, running migrations, adding indexes, or working with the PostgreSQL database via Prisma ORM v7."
---

# Prisma Database Operations

## Schema Location
`prisma/schema.prisma` — single schema file for all models.

## Connection
- PostgreSQL via Prisma Postgres with `@prisma/adapter-pg`
- Client initialized in `app/_lib/prisma.ts` as a singleton

## Model Conventions
Every new finance model MUST include:
```prisma
model NewModel {
  id        String   @id @default(cuid())
  userId    String
  coupleId  String?
  // ... other fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("new_models")  // snake_case table name
}
```

Key requirements:
- `coupleId String?` — optional, for couple data sharing
- `@@index([userId])` — required for query performance
- `@@map("table_name")` — snake_case table mapping
- `@default(cuid())` for IDs
- `createdAt` + `updatedAt` timestamps

## Existing Finance Models
| Model | Table | Key Relations |
|-------|-------|---------------|
| FinancialAccount | financial_accounts | Has many Transaction |
| Transaction | transactions | Belongs to FinancialAccount |
| Budget | budgets | Standalone |
| Loan | loans | Standalone |
| SavingsGoal | savings_goals | Standalone |
| Couple | couples | Has many CoupleMember, CoupleInvite |
| CoupleMember | couple_members | role: OWNER or PARTNER |
| CoupleInvite | couple_invites | token-based, status: PENDING/ACCEPTED/EXPIRED |

## Auth Models (managed by Auth.js)
- User, Account, Session, VerificationToken

## Migration Commands
```bash
# Create a new migration
npx prisma migrate dev --name descriptive-name

# Apply migrations in production (done automatically via npm run build)
npx prisma migrate deploy

# Reset database (destructive!)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Generate client after schema change
npx prisma generate
```

## Adding a New Model Checklist
1. Add model to `prisma/schema.prisma` with all conventions above
2. Add relation to `User` model if needed
3. Run `npx prisma migrate dev --name add-model-name`
4. Create server actions in `app/finance/_actions/`
5. Apply couple data sharing pattern in all queries
