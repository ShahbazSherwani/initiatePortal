#!/bin/bash

echo "🚀 Preparing for deployment..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your code to GitHub"
    echo "2. Choose a hosting platform:"
    echo "   • Vercel (frontend) + Render (backend) - Recommended"
    echo "   • Railway (full-stack)"
    echo "   • Heroku (full-stack)"
    echo ""
    echo "3. Set up environment variables:"
    echo "   • DATABASE_URL (from Supabase)"
    echo "   • Firebase configuration"
    echo "   • NODE_ENV=production"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed instructions"
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi
