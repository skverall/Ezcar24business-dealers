#!/bin/bash

echo "🔧 Fixing iOS signing and build issues..."

# Navigate to iOS project directory
cd ios/App

echo "📱 Step 1: Cleaning previous builds..."
rm -rf build/
rm -rf DerivedData/

echo "🔄 Step 2: Reinstalling CocoaPods..."
pod deintegrate --silent
pod install --silent

echo "⚙️ Step 3: Updating Xcode project settings..."
# The project.pbxproj has already been updated to disable sandboxing

echo "🚀 Step 4: Opening Xcode..."
open App.xcworkspace

echo ""
echo "✅ Fixes applied! Now in Xcode:"
echo ""
echo "1. Select 'App' project in the navigator"
echo "2. Go to 'Signing & Capabilities' tab"
echo "3. Select your Team (Apple ID or Developer Account)"
echo "4. Make sure 'Automatically manage signing' is checked"
echo "5. If needed, change Bundle Identifier to: com.yourname.ezcar24"
echo "6. Select a simulator and click Run (▶️)"
echo ""
echo "🎉 Your app should now build successfully!"
