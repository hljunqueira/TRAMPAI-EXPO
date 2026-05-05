INSERT INTO app_config (key, value) VALUES
  ('lead_normal_cost',     '1'),
  ('lead_exclusive_cost',  '3'),
  ('welcome_credits',      '5'),
  ('referral_bonus',       '3'),
  ('app_maintenance_mode', 'false'),
  ('pix_key',              ''),
  ('pix_holder_name',      ''),
  ('pix_key_type',         'EMAIL')
ON CONFLICT (key) DO NOTHING;

INSERT INTO credit_packages (name, credits, price_cents, bonus_credits, is_active, is_highlighted, sort_order) VALUES
  ('Básico',   10,  990,  0,  true, false, 1),
  ('Popular',  30, 2490,  5,  true, true,  2),
  ('Pro',     100, 6990, 20,  true, false, 3)
ON CONFLICT DO NOTHING;
