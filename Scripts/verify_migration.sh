#!/bin/bash

# Script to verify that the migration was successful
# This checks if the updated_at column exists in dealer_users table

echo "🔍 Verifying Supabase Migration..."
echo ""

# Check if dealer_users table has updated_at column
response=$(curl -s -X GET 'https://texjdsagegkceahuufml.supabase.co/rest/v1/dealer_users?select=id,name,created_at,updated_at&limit=1' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleGpkc2FnZWdrY2VhaHV1Zm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTM3ODMsImV4cCI6MjA3NzkyOTc4M30.85WstSCAin_KtVxIEnF3FPZk1grax6_J-yNwSlioGhk" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleGpkc2FnZWdrY2VhaHV1Zm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTM3ODMsImV4cCI6MjA3NzkyOTc4M30.85WstSCAin_KtVxIEnF3FPZk1grax6_J-yNwSlioGhk")

echo "Response: $response"
echo ""

# Check if response contains error about updated_at column
if echo "$response" | grep -q "column.*updated_at.*does not exist"; then
    echo "❌ Migration NOT completed!"
    echo ""
    echo "The updated_at column does not exist in dealer_users table."
    echo ""
    echo "Please run the migration:"
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Open SQL Editor"
    echo "3. Run: Scripts/supabase_migration_add_updated_at.sql"
    echo ""
    echo "📝 See FIX_SYNC_ERROR.md for quick instructions"
    exit 1
elif echo "$response" | grep -q "updated_at"; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "The updated_at column exists in dealer_users table."
    echo ""
    echo "📋 Next steps:"
    echo "1. Rebuild your app in Xcode"
    echo "2. Run the app"
    echo "3. Test the sync functionality"
    echo ""
    exit 0
elif echo "$response" | grep -q '\[\]'; then
    echo "⚠️  Table is empty, but migration might be completed."
    echo ""
    echo "To verify, please:"
    echo "1. Go to Supabase Dashboard"
    echo "2. Open SQL Editor"
    echo "3. Run: SELECT column_name FROM information_schema.columns WHERE table_name = 'dealer_users';"
    echo ""
    echo "You should see 'updated_at' in the list."
    echo ""
    exit 0
else
    echo "⚠️  Unable to verify migration status."
    echo ""
    echo "Response: $response"
    echo ""
    echo "Please verify manually:"
    echo "1. Go to Supabase Dashboard"
    echo "2. Open SQL Editor"
    echo "3. Run: SELECT column_name FROM information_schema.columns WHERE table_name = 'dealer_users';"
    echo ""
    exit 1
fi

