---
name: testing
description: "Testing standards for the next-web monorepo. Covers what to test, test structure, coverage targets, and TDD workflow for server actions, helpers, components, hooks, and API routes."
applyTo: "**/*.test.{ts,tsx}"
---

# Testing Standard

## Absolute Rule
Every new feature, bug fix, or refactor MUST ship with tests. Untested code does not get committed.

## What to Test

| Code Type | Coverage Required |
|-----------|-------------------|
| Server actions (`app/couple/finance/_actions/**`) | Happy path + auth-failure + validation-failure |
| Pure helpers (`app/_lib/**`, `app/_utils/**`, `app/_services/**`) | All branches |
| React components | Render + 1 user interaction (no snapshot-only) |
| Custom hooks | `renderHook` — initial state + 1 state transition |
| API route handlers (`app/api/**`) | Happy path + auth-failure |

## What NOT to Test
- Trivial barrel files (re-exports only)
- Pure styled-components (`*.styled.ts`)
- Auto-generated code (`prisma/migrations/**`, `next-env.d.ts`)

## Test Location
- Co-located: `__tests__/` next to file under test
- Pattern: `<source>.test.ts` or `<source>.test.tsx`
- Example: `app/_lib/__tests__/formatters.test.ts`

## Coverage Target
- ≥ 80% line coverage on touched files
- Run: `npm test -- --coverage`

## Test Style
- Use `describe` + `it` blocks
- Test names start with "should …"
- One assertion target per `it` block
- Use `beforeEach` for setup; no shared mutable state
- Mock external services at the module boundary (not global)

## TDD Workflow
- **Bug fix**: add failing test FIRST, then fix until green
- **Refactor**: existing tests must pass without modification
- **New feature**: write interface test (red), implement (green), refine

## Mocking
- Prisma: thin in-memory shim or `jest.mock`
- Auth.js: mock `auth()` return value per test
- Gemini/fetch: mock at module boundary
- Never mock at global level
