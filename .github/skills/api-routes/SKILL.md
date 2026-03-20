---
name: api-routes
description: "Build API routes in the next-web project. Covers both legacy MongoDB routes (app/api/) and v1 JWT-authenticated Prisma routes (app/api/v1/). Use when creating or modifying any API endpoint, handling authentication, or connecting to external services."
---

# API Route Development

## Two API Layers

### Legacy API (`app/api/`)
- MongoDB via Mongoose models in `app/models/`
- Various auth patterns (some unprotected)
- Endpoints: app, config, feature, files, images, maintenance, profile, pwa

### v1 API (`app/api/v1/finance/`)
- PostgreSQL via Prisma
- JWT authentication via `authenticateRequest()`
- All finance CRUD operations

## v1 Route Pattern
```typescript
// app/api/v1/finance/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/_lib/prisma";
import { authenticateRequest } from "@/api/v1/_lib/auth";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";

export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  const coupleUserIds = await getUserIdsForCouple(userId);
  const data = await prisma.model.findMany({
    where: { userId: { in: coupleUserIds } },
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  const body = await request.json();
  const coupleId = await getCoupleIdForUser(userId);

  const record = await prisma.model.create({
    data: { ...body, userId, ...(coupleId ? { coupleId } : {}) },
  });

  return NextResponse.json(record, { status: 201 });
}
```

## Auth Helper
`app/api/v1/_lib/auth.ts` exports `authenticateRequest()`:
- Returns `userId: string` on success
- Returns `NextResponse` with 401 on failure
- Validates JWT from `Authorization: Bearer <token>` header

## Long-Running Routes
For AI/Gemini or heavy computation routes:
```typescript
export const maxDuration = 60; // seconds
```

## Dynamic Route Parameters
```typescript
// app/api/v1/finance/example/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

## Error Handling
```typescript
try {
  // operation
} catch (error) {
  console.error("Operation failed:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```
