#!/bin/bash

echo "🚀 Applying application_logs migration to Supabase..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f "uae-wheels-hub/.env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo ""
    echo "Please create uae-wheels-hub/.env with your Supabase credentials:"
    echo ""
    echo "VITE_SUPABASE_URL=https://your-project.supabase.co"
    echo "VITE_SUPABASE_ANON_KEY=your-anon-key"
    echo ""
    echo "You can find these in your Supabase Dashboard → Settings → API"
    exit 1
fi

# Read Supabase URL and Key from .env
export $(cat uae-wheels-hub/.env | grep -E "VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY" | xargs)

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Error: Missing Supabase credentials in .env${NC}"
    echo ""
    echo "Please add to uae-wheels-hub/.env:"
    echo "VITE_SUPABASE_URL=https://your-project.supabase.co"
    echo "VITE_SUPABASE_ANON_KEY=your-anon-key"
    exit 1
fi

echo "Found Supabase project: $VITE_SUPABASE_URL"
echo ""

# Read migration SQL
MIGRATION_SQL=$(cat supabase/migrations/20251207000000_create_application_logs.sql)

echo -e "${YELLOW}⚠️  Note: Direct SQL execution via REST API is limited.${NC}"
echo ""
echo "Please apply the migration using one of these methods:"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}METHOD 1: Supabase Dashboard (RECOMMENDED)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Click on 'SQL Editor' in the left sidebar"
echo "4. Click 'New Query'"
echo "5. Copy the ENTIRE contents of this file:"
echo "   ${YELLOW}supabase/migrations/20251207000000_create_application_logs.sql${NC}"
echo "6. Paste into the SQL Editor"
echo "7. Click 'Run' (or press Cmd+Enter)"
echo ""
echo "You should see: '✓ Success. No rows returned'"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}METHOD 2: Install Supabase CLI${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Run these commands:"
echo ""
echo "  # Install Supabase CLI"
echo "  brew install supabase/tap/supabase"
echo ""
echo "  # Link to your project"
echo "  cd supabase"
echo "  supabase link --project-ref YOUR_PROJECT_REF"
echo ""
echo "  # Apply migration"
echo "  supabase db push"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "After applying the migration, verify it worked:"
echo ""
echo "1. Go to Supabase Dashboard → Table Editor"
echo "2. Look for 'application_logs' table"
echo "3. You should see columns: id, timestamp, level, message, context, etc."
echo ""
echo "Then you're ready to use the error logging system! 🎉"
echo ""
echo "Read the Quick Start Guide:"
echo "  ${YELLOW}QUICK_START_GUIDE.md${NC}"
echo ""
