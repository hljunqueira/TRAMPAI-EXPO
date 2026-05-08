SELECT email, credit_balance FROM users WHERE email = 'henrique@trampai.com.br';
SELECT * FROM transactions WHERE user_id = (SELECT id FROM users WHERE email = 'henrique@trampai.com.br') AND type = 'PURCHASE' ORDER BY created_at DESC;
