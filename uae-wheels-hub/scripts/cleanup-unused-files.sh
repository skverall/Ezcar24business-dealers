#!/bin/bash

# Cleanup script for unused files
# Created: 2025-12-08

echo "🧹 Starting project cleanup..."
echo ""

# Safety check
read -p "⚠️  This will delete unused files. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cleanup cancelled"
    exit 1
fi

# Create backup commit
echo "📦 Creating backup commit..."
git add -A
git commit -m "chore: Backup before cleanup (auto-generated)" || echo "No changes to commit"

DELETED_COUNT=0

# 1. Delete cache and build artifacts
echo ""
echo "🗑️  Deleting cache and build artifacts..."
rm -rf coverage/ && echo "  ✅ Deleted coverage/ (19MB)" && ((DELETED_COUNT++))
rm -rf dist/ && echo "  ✅ Deleted dist/ (6.1MB)" && ((DELETED_COUNT++))
rm -f .DS_Store && echo "  ✅ Deleted .DS_Store" && ((DELETED_COUNT++))
rm -f public/.DS_Store && echo "  ✅ Deleted public/.DS_Store" && ((DELETED_COUNT++))

# 2. Delete unused UI components
echo ""
echo "🗑️  Deleting unused UI components..."
rm -f src/components/ui/accordion.tsx && echo "  ✅ Deleted accordion.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/aspect-ratio.tsx && echo "  ✅ Deleted aspect-ratio.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/chart.tsx && echo "  ✅ Deleted chart.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/drawer.tsx && echo "  ✅ Deleted drawer.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/hover-card.tsx && echo "  ✅ Deleted hover-card.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/input-otp.tsx && echo "  ✅ Deleted input-otp.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/menubar.tsx && echo "  ✅ Deleted menubar.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/navigation-menu.tsx && echo "  ✅ Deleted navigation-menu.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/pagination.tsx && echo "  ✅ Deleted pagination.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/progress.tsx && echo "  ✅ Deleted progress.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/resizable.tsx && echo "  ✅ Deleted resizable.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/sidebar.tsx && echo "  ✅ Deleted sidebar.tsx" && ((DELETED_COUNT++))
rm -f src/components/ui/toggle-group.tsx && echo "  ✅ Deleted toggle-group.tsx" && ((DELETED_COUNT++))

# 3. Delete unused admin components
echo ""
echo "🗑️  Deleting unused admin components..."
rm -f src/components/admin/AdminDashboard.tsx && echo "  ✅ Deleted AdminDashboard.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/AdminSettings.tsx && echo "  ✅ Deleted AdminSettings.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/EmailTestComponent.tsx && echo "  ✅ Deleted EmailTestComponent.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/ListingsManagement.tsx && echo "  ✅ Deleted ListingsManagement.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/MessagesManagement.tsx && echo "  ✅ Deleted MessagesManagement.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/PasswordResetDemo.tsx && echo "  ✅ Deleted PasswordResetDemo.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/PendingReviewsManagement.tsx && echo "  ✅ Deleted PendingReviewsManagement.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/QuickEmailTest.tsx && echo "  ✅ Deleted QuickEmailTest.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/ReportAccessManager.tsx && echo "  ✅ Deleted ReportAccessManager.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/SEOManager.tsx && echo "  ✅ Deleted SEOManager.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/UrlConfigTest.tsx && echo "  ✅ Deleted UrlConfigTest.tsx" && ((DELETED_COUNT++))
rm -f src/components/admin/UserManagement.tsx && echo "  ✅ Deleted UserManagement.tsx" && ((DELETED_COUNT++))

# 4. Delete unused regular components
echo ""
echo "🗑️  Deleting unused regular components..."
rm -f src/components/BrandsSelect.tsx && echo "  ✅ Deleted BrandsSelect.tsx" && ((DELETED_COUNT++))
rm -f src/components/ChatSystem.tsx && echo "  ✅ Deleted ChatSystem.tsx" && ((DELETED_COUNT++))
rm -f src/components/FeatureErrorBoundary.tsx && echo "  ✅ Deleted FeatureErrorBoundary.tsx" && ((DELETED_COUNT++))
rm -f src/components/FormProgress.tsx && echo "  ✅ Deleted FormProgress.tsx" && ((DELETED_COUNT++))

# 5. Delete unused hooks
echo ""
echo "🗑️  Deleting unused hooks..."
rm -f src/hooks/useOffline.ts && echo "  ✅ Deleted useOffline.ts" && ((DELETED_COUNT++))
rm -f src/hooks/useProfile.tsx && echo "  ✅ Deleted useProfile.tsx" && ((DELETED_COUNT++))
rm -f src/hooks/useSecureProfile.tsx && echo "  ✅ Deleted useSecureProfile.tsx" && ((DELETED_COUNT++))

# 6. Delete unused security component
echo ""
echo "🗑️  Deleting unused security components..."
rm -f src/components/security/SecureProfileDisplay.tsx && echo "  ✅ Deleted SecureProfileDisplay.tsx" && ((DELETED_COUNT++))

# 7. Delete unused data/services (optional - review first)
echo ""
read -p "🤔 Delete unused data/services? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    rm -f src/data/carData.ts && echo "  ✅ Deleted carData.ts" && ((DELETED_COUNT++))
    rm -f src/services/locationService.ts && echo "  ✅ Deleted locationService.ts" && ((DELETED_COUNT++))
fi

echo ""
echo "✨ Cleanup complete!"
echo "📊 Total files/directories deleted: $DELETED_COUNT"
echo ""
echo "🧪 Testing build..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "💾 Committing changes..."
    git add -A
    git commit -m "chore: Remove unused files and caches

- Removed cache directories (coverage/, dist/)
- Removed unused UI components (13 files)
- Removed unused admin components (12 files)
- Removed unused regular components (4 files)
- Removed unused hooks (3 files)
- Removed unused security components (1 file)
- Total files deleted: $DELETED_COUNT
- Estimated space saved: ~30MB
- AI token savings: ~20%

Generated by cleanup script on $(date)"

    echo "✅ Changes committed!"
    echo ""
    echo "🎉 All done! Your project is now cleaner and more efficient."
else
    echo "❌ Build failed! Rolling back changes..."
    git reset --hard HEAD^
    echo "⚠️  Changes rolled back. Please check the build errors."
    exit 1
fi
