-- Grant table access for debt sync RPCs

GRANT USAGE ON SCHEMA crm TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE crm.debts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE crm.debt_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE crm.account_transactions TO authenticated;
