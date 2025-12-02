-- CRM schema for dealer-scoped data with strict RLS on dealer_id

-- Helper to gate access by dealer ownership or membership
CREATE OR REPLACE FUNCTION public.crm_can_access(p_dealer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL AND (
    auth.uid() = p_dealer_id OR
    EXISTS (
      SELECT 1 FROM public.crm_dealer_users du
      WHERE du.dealer_id = p_dealer_id
        AND du.id = auth.uid()
        AND du.deleted_at IS NULL
    )
  );
END;
$$;

-- Dealer users
CREATE TABLE IF NOT EXISTS public.crm_dealer_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE public.crm_dealer_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_dealer_users_select
ON public.crm_dealer_users
FOR SELECT USING (public.crm_can_access(dealer_id));

CREATE POLICY crm_dealer_users_insert
ON public.crm_dealer_users
FOR INSERT WITH CHECK (auth.uid() = dealer_id);

CREATE POLICY crm_dealer_users_update
ON public.crm_dealer_users
FOR UPDATE USING (auth.uid() = dealer_id OR auth.uid() = id)
WITH CHECK (auth.uid() = dealer_id OR auth.uid() = id);

CREATE POLICY crm_dealer_users_delete
ON public.crm_dealer_users
FOR DELETE USING (auth.uid() = dealer_id);

CREATE TRIGGER set_crm_dealer_users_updated_at
  BEFORE UPDATE ON public.crm_dealer_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Financial accounts
CREATE TABLE IF NOT EXISTS public.crm_financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE public.crm_financial_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_financial_accounts_select
ON public.crm_financial_accounts
FOR SELECT USING (public.crm_can_access(dealer_id));

CREATE POLICY crm_financial_accounts_write
ON public.crm_financial_accounts
FOR ALL USING (public.crm_can_access(dealer_id))
WITH CHECK (public.crm_can_access(dealer_id));

CREATE TRIGGER set_crm_fin_accounts_updated_at
  BEFORE UPDATE ON public.crm_financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vehicles
CREATE TABLE IF NOT EXISTS public.crm_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vin text NOT NULL,
  make text,
  model text,
  year integer,
  purchase_price numeric NOT NULL DEFAULT 0,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'available',
  notes text,
  sale_price numeric,
  sale_date date,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (dealer_id, vin)
);
ALTER TABLE public.crm_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_vehicles_select
ON public.crm_vehicles
FOR SELECT USING (public.crm_can_access(dealer_id));

CREATE POLICY crm_vehicles_write
ON public.crm_vehicles
FOR ALL USING (public.crm_can_access(dealer_id))
WITH CHECK (public.crm_can_access(dealer_id));

CREATE TRIGGER set_crm_vehicles_updated_at
  BEFORE UPDATE ON public.crm_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Expense templates
CREATE TABLE IF NOT EXISTS public.crm_expense_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  default_description text,
  default_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE public.crm_expense_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_expense_templates_select
ON public.crm_expense_templates
FOR SELECT USING (public.crm_can_access(dealer_id));

CREATE POLICY crm_expense_templates_write
ON public.crm_expense_templates
FOR ALL USING (public.crm_can_access(dealer_id))
WITH CHECK (public.crm_can_access(dealer_id));

CREATE TRIGGER set_crm_expense_templates_updated_at
  BEFORE UPDATE ON public.crm_expense_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Expenses
CREATE TABLE IF NOT EXISTS public.crm_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.crm_vehicles(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.crm_financial_accounts(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE public.crm_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_expenses_select
ON public.crm_expenses
FOR SELECT USING (public.crm_can_access(dealer_id));

CREATE POLICY crm_expenses_write
ON public.crm_expenses
FOR ALL USING (public.crm_can_access(dealer_id))
WITH CHECK (public.crm_can_access(dealer_id) AND (user_id IS NULL OR user_id = auth.uid()));

CREATE TRIGGER set_crm_expenses_updated_at
  BEFORE UPDATE ON public.crm_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sales
CREATE TABLE IF NOT EXISTS public.crm_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.crm_vehicles(id) ON DELETE CASCADE,
  sale_price numeric NOT NULL DEFAULT 0,
  amount numeric GENERATED ALWAYS AS (sale_price) STORED,
  profit numeric DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  buyer_name text,
  buyer_phone text,
  payment_method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE public.crm_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_sales_select
ON public.crm_sales
FOR SELECT USING (public.crm_can_access(dealer_id));

CREATE POLICY crm_sales_write
ON public.crm_sales
FOR ALL USING (public.crm_can_access(dealer_id))
WITH CHECK (public.crm_can_access(dealer_id));

CREATE TRIGGER set_crm_sales_updated_at
  BEFORE UPDATE ON public.crm_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Clients
CREATE TABLE IF NOT EXISTS public.crm_dealer_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  request_details text,
  preferred_date date,
  status text NOT NULL DEFAULT 'active',
  vehicle_id uuid REFERENCES public.crm_vehicles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE public.crm_dealer_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_clients_select
ON public.crm_dealer_clients
FOR SELECT USING (public.crm_can_access(dealer_id));

CREATE POLICY crm_clients_write
ON public.crm_dealer_clients
FOR ALL USING (public.crm_can_access(dealer_id))
WITH CHECK (public.crm_can_access(dealer_id));

CREATE TRIGGER set_crm_clients_updated_at
  BEFORE UPDATE ON public.crm_dealer_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_crm_dealer_users_dealer ON public.crm_dealer_users(dealer_id);
CREATE INDEX IF NOT EXISTS idx_crm_fin_accounts_dealer ON public.crm_financial_accounts(dealer_id);
CREATE INDEX IF NOT EXISTS idx_crm_vehicles_dealer ON public.crm_vehicles(dealer_id);
CREATE INDEX IF NOT EXISTS idx_crm_expenses_dealer_date ON public.crm_expenses(dealer_id, date);
CREATE INDEX IF NOT EXISTS idx_crm_sales_dealer_date ON public.crm_sales(dealer_id, date);
CREATE INDEX IF NOT EXISTS idx_crm_clients_dealer_status ON public.crm_dealer_clients(dealer_id, status);
