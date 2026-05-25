---
name: coding-standards
description: "Enforces code quality rules for the next-web monorepo: DRY, KISS, 300-line file cap, no inline styles, and JSDoc documentation standard. Apply to all TypeScript/JavaScript source files."
applyTo: "app/**/*.{ts,tsx,js,jsx}"
---

# Coding Standards

## DRY / No Duplication
- **Rule**: if the same expression, calculation, formatter, regex, or block of logic appears in **2 or more places**, extract it into a shared helper. No copy-paste.
- **Where helpers go**:
  - Finance-specific business logic → `app/_services/finance/<area>.ts`
  - Generic UI/data formatters → `app/_utils/finance/format.ts` or closest `_utils.ts`
  - Module-local helpers → `<feature>/_utils.ts`
  - React hooks reused in 2+ components → `app/_hooks/<useThing>.ts` (global) or `<feature>/_hooks/<useThing>.ts` (local)
  - Styled-component atoms reused across files → `_styled.ts` in nearest shared folder
- **Banned patterns**:
  - Two files defining their own `formatCurrency`, `typeIcon`, `typeLabel`, `EASING`, etc.
  - Two server actions repeating the same Zod schema
  - Two components inlining the same `useEffect` cleanup or `useState` + setter pattern
  - Identical Prisma query bodies in 2+ actions
- **When you touch a file**: refactor duplication as part of the same change set.
- **When you create a new file**: search workspace for existing implementation first. Reuse first; create only if nothing exists.
- **Tolerable exceptions**: trivial 1–2 line snippets, test fixtures/mocks, generated code.

## KISS Principle
- Default to the simplest solution that works. No abstractions until needed at least twice.
- **Banned**:
  - Premature abstraction (factories, DI containers for one use case)
  - Speculative options (params with no current caller)
  - Indirection layers when a single function works
  - Custom reactive systems when React state + props suffice
  - Dense ternary chains, golf-style one-liners
  - Unused exports / dead code
- **Preferred**:
  - Named functions over anonymous IIFE chains
  - Early `return` over nested `if/else`
  - `switch` or lookup objects over long ternaries
  - Plain `useState` + `useEffect` over hooks-of-hooks for one-shot logic
  - Server Components when no interactivity needed

## File Size Limit (300 lines hard cap)
- Any `.ts`/`.tsx`/`.js`/`.jsx` > 300 lines must be split before commit.
- **Split strategy** (preferred order):
  1. Move `styled.X` blocks → `_styled.ts`
  2. Extract UI sections → `_components/<Name>.tsx`
  3. Extract helpers → `_utils.ts`
  4. Extract hooks → `_hooks/<useThing>.ts`
  5. Extract types → `_types.ts`
- **Exceptions** (justify in commit): `prisma/migrations/**`, `prisma/schema.prisma`, test files.

## No Inline Styles
- **Banned**: `<div style={{ ... }}>` and any JSX `style={{}}` prop usage.
- **Fix per module**:
  - Finance / couple (styled-components) → extend or create styled component, use `$transient` props
  - Legacy profile / admin (SCSS + Tailwind) → Tailwind utilities or `.scss` class
- **Allowed exceptions**: SVG runtime attributes with no CSS equivalent (document with `// inline-style: <reason>`).

## Documentation Standard (JSDoc/TSDoc)
- **Every exported symbol** must have a TSDoc block.
- **Required**: one-line summary, `@param`, `@returns`, `@throws` if applicable.
- **Server actions**: must state `@remarks Auth: requires session` and any `revalidatePath` calls.
- **Route handlers**: must state HTTP method + auth strategy.
- **When touching a file**: add docs to undocumented exports in that file.
