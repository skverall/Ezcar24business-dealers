#!/bin/bash

# Ezcar24 Business - Project Verification Script
# This script verifies that all required files are present

echo "🔍 Verifying Ezcar24 Business Project Structure..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for missing files
missing_count=0
total_count=0

# Function to check if file exists
check_file() {
    total_count=$((total_count + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 ${RED}(MISSING)${NC}"
        missing_count=$((missing_count + 1))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
    else
        echo -e "${RED}✗${NC} $1/ ${RED}(MISSING)${NC}"
        missing_count=$((missing_count + 1))
    fi
}

echo "📁 Project Structure:"
echo "-------------------"
check_file "Ezcar24Business.xcodeproj/project.pbxproj"
check_file "Ezcar24Business.xcodeproj/project.xcworkspace/contents.xcworkspacedata"
check_dir "Ezcar24Business"
echo ""

echo "📱 App Files:"
echo "-------------"
check_file "Ezcar24Business/Ezcar24BusinessApp.swift"
check_file "Ezcar24Business/ContentView.swift"
echo ""

echo "💾 Models:"
echo "----------"
check_file "Ezcar24Business/Models/Ezcar24Business.xcdatamodeld/Ezcar24Business.xcdatamodel/contents"
check_file "Ezcar24Business/Models/PersistenceController.swift"
echo ""

echo "🧠 ViewModels:"
echo "--------------"
check_file "Ezcar24Business/ViewModels/DashboardViewModel.swift"
check_file "Ezcar24Business/ViewModels/VehicleViewModel.swift"
check_file "Ezcar24Business/ViewModels/ExpenseViewModel.swift"
check_file "Ezcar24Business/ViewModels/UserViewModel.swift"
echo ""

echo "🎨 Views:"
echo "---------"
check_file "Ezcar24Business/Views/DashboardView.swift"
check_file "Ezcar24Business/Views/VehicleListView.swift"
check_file "Ezcar24Business/Views/VehicleDetailView.swift"
check_file "Ezcar24Business/Views/AddVehicleView.swift"
check_file "Ezcar24Business/Views/ExpenseListView.swift"
check_file "Ezcar24Business/Views/AddExpenseView.swift"
check_file "Ezcar24Business/Views/UserManagementView.swift"
echo ""

echo "🛠 Utilities:"
echo "-------------"
check_file "Ezcar24Business/Utilities/ColorTheme.swift"
check_file "Ezcar24Business/Utilities/CurrencyFormatter.swift"
echo ""

echo "🎨 Assets:"
echo "----------"
check_file "Ezcar24Business/Assets.xcassets/Contents.json"
check_file "Ezcar24Business/Assets.xcassets/AppIcon.appiconset/Contents.json"
check_file "Ezcar24Business/Assets.xcassets/AccentColor.colorset/Contents.json"
echo ""

echo "📚 Documentation:"
echo "-----------------"
check_file "README.md"
check_file "QUICKSTART.md"
check_file "PROJECT_SUMMARY.md"
echo ""

# Summary
echo "================================"
if [ $missing_count -eq 0 ]; then
    echo -e "${GREEN}✅ All files present! ($total_count/$total_count)${NC}"
    echo ""
    echo "🚀 Project is ready to build!"
    echo ""
    echo "Next steps:"
    echo "1. Open Ezcar24Business.xcodeproj in Xcode"
    echo "2. Select an iPhone simulator"
    echo "3. Press Cmd+R to build and run"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Missing $missing_count file(s)${NC}"
    echo ""
    echo "Please ensure all files are present before building."
    echo ""
    exit 1
fi

