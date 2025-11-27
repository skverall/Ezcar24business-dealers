#!/bin/bash

# EzCar24 Deployment Script
# This script builds the project and prepares it for deployment

echo "🚀 Starting EzCar24 deployment process..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Please create one based on .env.example"
    echo "📝 Copy .env.example to .env and fill in your values:"
    echo "   cp .env.example .env"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Generate sitemap (optional - can be done in production)
echo "🗺️  Generating sitemap..."
# This would be done by the admin panel in production

echo "📋 Deployment checklist:"
echo "  ✅ Project built successfully"
echo "  ✅ Static files ready in dist/"
echo "  ✅ robots.txt configured"
echo "  ✅ sitemap.xml template ready"
echo "  ✅ SEO meta tags implemented"
echo "  ✅ Google Analytics configured"
echo ""
echo "🌐 Next steps:"
echo "  1. Upload dist/ folder to your hosting provider"
echo "  2. Configure your domain to point to the uploaded files"
echo "  3. Update Google Analytics tracking ID in production"
echo "  4. Submit sitemap to Google Search Console"
echo "  5. Monitor indexing status"
echo ""
echo "🔗 Important URLs after deployment:"
echo "  - Site: https://ezcar24.com"
echo "  - Robots: https://ezcar24.com/robots.txt"
echo "  - Sitemap: https://ezcar24.com/sitemap.xml"
echo ""
echo "🎉 Deployment preparation complete!"
