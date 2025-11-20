#!/bin/bash

# Script to execute Supabase migration via REST API
# This script calls the run_dealer_users_migration() function

echo "🚀 Executing Supabase Migration via REST API..."
echo ""

# First, we need to create the migration function in Supabase
echo "⚠️  IMPORTANT: Before running this script, you need to:"
echo "1. Go to Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Open SQL Editor"
echo "3. Run the script: Scripts/create_migration_function.sql"
echo "4. Then come back and run this script"
echo ""
read -p "Have you created the migration function? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Please create the migration function first."
    echo "📝 See MIGRATION_GUIDE.md for instructions"
    exit 1
fi

echo ""
echo "📡 Calling migration function via REST API..."
echo ""

# Call the migration function via REST API
response=$(curl -s -X POST 'https://texjdsagegkceahuufml.supabase.co/rest/v1/rpc/run_dealer_users_migration' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleGpkc2FnZWdrY2VhaHV1Zm1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM1Mzc4MywiZXhwIjoyMDc3OTI5NzgzfQ.0t_VrhnTAl-lNQs9lJgKHiHJTtiYqzx3EcIJWtOoqWQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRleGpkc2FnZWdrY2VhaHV1Zm1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjM1Mzc4MywiZXhwIjoyMDc3OTI5NzgzfQ.0t_VrhnTAl-lNQs9lJgKHiHJTtiYqzx3EcIJWtOoqWQ" \
  -H "Content-Type: application/json")

echo "Response: $response"
echo ""

# Check if migration was successful
if echo "$response" | grep -q '"success":true'; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Rebuild your app in Xcode"
    echo "2. Run the app"
    echo "3. Test the sync functionality"
    echo ""
else
    echo "❌ Migration failed!"
    echo ""
    echo "Please run the migration manually:"
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Open SQL Editor"
    echo "3. Run: Scripts/supabase_migration_add_updated_at.sql"
    echo ""
    echo "📝 See MIGRATION_GUIDE.md for detailed instructions"
fi

