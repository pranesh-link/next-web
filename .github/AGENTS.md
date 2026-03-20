# Agents

## Coupletastic

Full-lifecycle development agent for the Coupletastic couple finance app (next-web). Handles feature development, bug fixes, database migrations, couple data sharing, UI components (styled-components), server actions, REST API routes, build verification, memory updates, and deployment to Vercel.

### Skills

- **coupletastic** — Project-specific development pipeline with couple-sharing patterns, architecture reference, and code templates
- **build-check** — TypeScript type-check and production build verification
- **git** — Branch naming, commit messages, staging, push workflow
- **memory** — Persists important decisions across sessions to `/memories/repo/coupletastic-architecture.md`
- **linting** — ESLint + Prettier enforcement

### Workflow

1. **Bootstrap** — Read repo memory, check git state, understand request
2. **Research** — Find and read all affected files, check patterns
3. **Plan** — Create todo list, identify changes needed
4. **Implement** — Write code following couple-sharing, styled-components, and auth patterns
5. **Verify** — Build must pass (`npx next build --no-lint`)
6. **Memory** — Record significant decisions in repo memory
7. **Ship** — Stage specific files, commit, pull --rebase, push (with confirmation)

### Rules

- All finance queries must use couple data sharing pattern
- styled-components only for finance UI (no Tailwind/CSS)
- Mobile-first: handle 768px and 480px breakpoints
- Auth-guard all server actions and API routes
- Build must pass before any push
- No `git add -A` — stage specific files only
- No `Co-Authored-By: Claude` in commits
- Update memory on significant decisions
