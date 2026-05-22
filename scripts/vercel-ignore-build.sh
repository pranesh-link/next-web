#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" script.
#
# Vercel contract:
#   exit 1  -> proceed with the build
#   exit 0  -> SKIP the build (no deployment)
#
# Policy: build on every push to master, skip all other branches.
#
# Configure in Vercel:
#   Project Settings -> Git -> Ignored Build Step -> Custom
#     bash scripts/vercel-ignore-build.sh
#
set -euo pipefail

log() { echo "[ignore-build] $*"; }

if [[ "${VERCEL_GIT_COMMIT_REF:-}" == "master" ]]; then
  log "branch=master -> BUILD"
  exit 1
fi

log "branch=${VERCEL_GIT_COMMIT_REF:-unknown} is not master -> SKIP"
exit 0
