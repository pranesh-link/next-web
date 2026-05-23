#!/bin/bash
# Setup Vercel environment variables for production
# Run this in a Codespace or environment with public npm access
# Usage: bash scripts/setup-vercel-env.sh

set -e

echo "=== Installing Vercel CLI ==="
npm install -g vercel

echo ""
echo "=== Login to Vercel ==="
vercel login

echo ""
echo "=== Link to project ==="
vercel link

echo ""
echo "=== Adding production environment variables ==="

echo 'AIzaSyDSJgQH2jq74pTyHtCR8NpHUDPeaPzvY4Q' | vercel env add GEMINI_API_KEY production
echo '24282158014-46vngus6rh904t1pi4rbpsauaqqggb8h.apps.googleusercontent.com' | vercel env add GOOGLE_CLIENT_ID production
echo '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' | vercel env add GOOGLE_CLIENT_SECRET production
echo 'k8iJEWCyklK2CQQkSO8j3+lJrkUQ5u95JIWw7i/Bdyg=' | vercel env add NEXTAUTH_SECRET production
echo 'https://pranesh.link' | vercel env add NEXTAUTH_URL production
echo 'https://pranesh.link' | vercel env add AUTH_BASE_URL production
echo 'https://pranesh.link' | vercel env add NEXT_PUBLIC_SITE_URL production
echo '60' | vercel env add NEXT_PUBLIC_REVALIDATE production
echo 'postgres://eddf53b3ec22da27dd38adddf1843a6d020f0e9c27516b6e88230ddcdf76d266:sk_9R5Mc6HwdK3uZeQyx45Fn@db.prisma.io:5432/postgres?sslmode=require' | vercel env add DATABASE_URL production
echo 'postgres://eddf53b3ec22da27dd38adddf1843a6d020f0e9c27516b6e88230ddcdf76d266:sk_9R5Mc6HwdK3uZeQyx45Fn@db.prisma.io:5432/postgres?sslmode=require' | vercel env add DIRECT_DATABASE_URL production
echo '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' | vercel env add OPENROUTER_API_KEY production
echo 'https://tender-midge-73171.upstash.io' | vercel env add UPSTASH_REDIS_REST_URL production
echo 'gQAAAAAAAR3TAAIncDExNDQ3NWEwZmFlOTk0ODkyYjI3OGY3NTRhNDIxZTRjZHAxNzMxNzE' | vercel env add UPSTASH_REDIS_REST_TOKEN production
echo '11ab47e6c529046ece8360ee35d38238a543ba77df919dc047efa882913cf8f5' | vercel env add CRON_SECRET production

echo ""
echo "=== Verifying ==="
vercel env ls

echo ""
echo "=== Done! Trigger a redeploy from Vercel dashboard to confirm. ==="
echo "After verifying, delete this script (it contains secrets):"
echo "  git rm scripts/setup-vercel-env.sh && git commit -m 'chore: remove env setup script' && git push"
