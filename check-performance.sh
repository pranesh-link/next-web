#!/bin/bash

# Performance Testing Script
# Run this to verify optimizations before deployment

echo "🚀 Running Performance Checks..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run 'npm install' first."
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Build the application
echo "📦 Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "📊 Bundle Analysis:"
echo "-------------------"

# Check .next folder size
NEXT_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
echo "Total .next size: $NEXT_SIZE"

# Check largest chunks
echo ""
echo "Largest JavaScript chunks:"
find .next/static/chunks -name "*.js" -type f -exec ls -lh {} \; | sort -k5 -hr | head -5 | awk '{print $5, $9}'

echo ""
echo "📈 Performance Tips:"
echo "-------------------"
echo "1. Check bundle sizes above - each chunk should be < 500KB"
echo "2. Monitor Core Web Vitals after deployment"
echo "3. Test on slow 3G connection"
echo "4. Check MongoDB connection from production IP"
echo "5. Verify CDN is serving static assets"

echo ""
echo "✅ Performance check complete!"
echo ""
echo "Next steps:"
echo "- Test locally: npm run serve"
echo "- Deploy to production"
echo "- Monitor metrics via Vercel/Analytics dashboard"
