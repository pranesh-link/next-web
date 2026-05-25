---
name: auth-patterns
description: "Authentication and authorization patterns for LuvVerse. Covers Auth.js v5 (Google OAuth, JWT), server action guards, API route JWT auth, and client sign-out."
applyTo: "app/_lib/auth*,app/api/**,app/couple/finance/_actions/**"
---

# Auth Patterns

## Auth.js v5 Setup
- Config: `app/_lib/auth.ts` exports `{ handlers, signIn, signOut, auth }`
- Strategy: JWT (no database sessions)
- Provider: Google OAuth
- Adapter: PrismaAdapter (for user/account persistence)
- Session: `session.user.id` available after `auth()`

## Server Actions (MANDATORY)
Every server action must start with:
```typescript
"use server";
import { auth } from "@/_lib/auth";

export async function myAction(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;
  // ... action logic
}
```

## API v1 Routes (JWT)
All v1 routes use `authenticateRequest()` from `app/api/v1/_lib/auth.ts`:
```typescript
import { authenticateRequest } from "@/api/v1/_lib/auth";

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;
  // ... route logic
}
```

## Client Sign-Out
- Use `signOut()` from `next-auth/react`
- Always show confirmation modal first
- Never use API redirect for sign-out

## Mobile (Flutter)
- Google Sign-In → get `idToken`
- Send idToken to backend `/api/v1/auth/verify` → receive JWT
- Store JWT in `flutter_secure_storage`
- Attach JWT as `Authorization: Bearer <token>` header on all API calls

## Route Protection
- `/couple/*` routes: require session (redirect to `/couple/login` if missing)
- `/api/v1/*` routes: require valid JWT (return 401 if missing/invalid)
- `/api/auth/*` routes: public (handled by Auth.js)
- Legacy `/api/*` routes: various patterns (check each route)
