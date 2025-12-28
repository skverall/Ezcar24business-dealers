## Backend / Sync Audit (Supabase)

Project:
- URL: https://haordpdxyyreliyzmire.supabase.co

### RPC availability
Present in public schema:
- get_changes
- sync_vehicles
- sync_expenses
- sync_sales
- sync_clients
- sync_users
- sync_accounts
- sync_account_transactions
- sync_templates
- sync_debts
- sync_debt_payments

### RLS status (key tables)
- RLS enabled: crm.vehicles, crm.expenses, crm.sales, crm.dealer_users, crm.financial_accounts, crm.expense_templates, public.crm_dealer_clients
- RLS disabled: crm.debts, crm.debt_payments, crm.account_transactions

### Policies (selected)
- crm.*: select/write policies exist for vehicles, expenses, sales, dealer_users, financial_accounts, expense_templates.
- public.crm_dealer_clients: "Enable all for users based on dealer_id".
- storage.objects: policies exist for vehicle-images (public read, authenticated write/delete).

### Storage buckets
- vehicle-images (public)
- listing-images (public)
- car-reports (public)
- avatars (public)

### Notes / Risks
- RLS disabled for debts/debt_payments/account_transactions. If unintended, this is a security gap.
- vehicle-images policies are bucket-level only (no dealer_id path checks).

