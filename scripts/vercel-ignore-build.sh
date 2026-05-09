#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" script.
#
# Vercel contract:
#   exit 1  -> proceed with the build
#   exit 0  -> SKIP the build (no deployment)
#
# Policy: only deploy when the "version" field in package.json changes.
# Anything else (including merge commits, doc edits, refactors, etc.) is skipped.
#
# Configure in Vercel:
#   Project Settings -> Git -> Ignored Build Step -> Custom
#     bash scripts/vercel-ignore-build.sh
#
set -euo pipefail

log() { echo "[ignore-build] $*"; }

# Always build for non-production branches if you want previews. Keep simple:
# only the production branch (master) is gated by version bump. Preview branches
# build as usual.
if [[ "${VERCEL_GIT_COMMIT_REF:-}" != "master" ]]; then
  log "branch=${VERCEL_GIT_COMMIT_REF:-unknown} is not master -> BUILD"
  exit 1
fi

# Ensure we have history to diff against. Vercel checks out shallow by default.
if ! git rev-parse HEAD~1 >/dev/null 2>&1; then
  log "shallow clone, fetching previous commit"
  git fetch --depth=2 origin "${VERCEL_GIT_COMMIT_REF:-master}" >/dev/null 2>&1 || true
fi

# If we still cannot diff (first commit on the branch), build to be safe.
if ! git rev-parse HEAD~1 >/dev/null 2>&1; then
  log "no previous commit available -> BUILD"
  exit 1
fi

# Skip merge commits unless the merge itself changed the version.
parent_count=$(git rev-list --parents -n 1 HEAD | awk '{print NF-1}')

prev_version=$(git show HEAD~1:package.json 2>/dev/null \
  | sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
  | head -n1 || true)

curr_version=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' package.json | head -n1 || true)

log "prev_version=${prev_version:-<none>} curr_version=${curr_version:-<none>} parents=${parent_count}"

if [[ -z "${curr_version}" ]]; then
  log "could not read current version -> BUILD (fail-open)"
  exit 1
fi

if [[ "${prev_version}" != "${curr_version}" ]]; then
  log "version bump detected (${prev_version} -> ${curr_version}) -> BUILD"
  exit 1
fi

log "no version bump -> SKIP"
exit 0
