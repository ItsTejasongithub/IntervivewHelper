#!/bin/bash

# Deploy Script for AI Interview Assistant
# This script helps you quickly deploy to Vercel or Netlify

echo "🚀 AI Interview Assistant - Deployment Helper"
echo "=============================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Ready for deployment"
    git branch -M main
    echo "✅ Git initialized!"
    echo ""
    echo "⚠️  Next step: Create a GitHub repository and run:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo "   git push -u origin main"
    exit 0
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 Uncommitted changes detected. Committing..."
    git add .
    git commit -m "Update: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "✅ Changes committed!"
fi

# Ask which platform
echo "Choose deployment platform:"
echo "1) Vercel (recommended)"
echo "2) Netlify"
echo "3) Just build locally"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔹 Deploying to Vercel..."
        echo ""
        if ! command -v vercel &> /dev/null; then
            echo "⚠️  Vercel CLI not installed. Installing..."
            npm install -g vercel
        fi
        vercel --prod
        echo ""
        echo "✅ Deployed to Vercel!"
        ;;
    2)
        echo ""
        echo "🔹 Deploying to Netlify..."
        echo ""
        if ! command -v netlify &> /dev/null; then
            echo "⚠️  Netlify CLI not installed. Installing..."
            npm install -g netlify-cli
        fi
        netlify deploy --prod
        echo ""
        echo "✅ Deployed to Netlify!"
        ;;
    3)
        echo ""
        echo "🔨 Building locally..."
        npm run build
        echo ""
        echo "✅ Build complete! Output in dist/ folder"
        echo "   You can now manually upload dist/ to any static host"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 All done!"
echo ""
echo "📝 Remember to set ANTHROPIC_API_KEY environment variable on your platform"
