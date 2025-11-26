#!/bin/bash

# FinSight Setup Script
# This script automates the initial setup process

echo "🚀 FinSight Setup Script"
echo "========================"
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

if [[ ! $NODE_VERSION =~ ^v18 ]] && [[ ! $NODE_VERSION =~ ^v20 ]]; then
    echo "⚠️  Warning: Node.js 18+ recommended. Current: $NODE_VERSION"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your actual credentials!"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

echo "📋 Next Steps:"
echo "1. Edit .env.local with your Supabase and OpenRouter credentials"
echo "2. Run SQL scripts in Supabase (see QUICKSTART.md)"
echo "3. Start dev server: npm run dev"
echo ""
echo "📚 Documentation:"
echo "- Quick Start: QUICKSTART.md"
echo "- Full Guide: README.md"
echo "- API Docs: API_DOCS.md"
echo "- Deployment: DEPLOYMENT.md"
echo ""
echo "Happy coding! 🎉"
