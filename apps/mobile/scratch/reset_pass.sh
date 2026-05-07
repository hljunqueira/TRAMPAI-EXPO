#!/bin/bash
HASH=$(docker exec -w /app trampai-api node -e "console.log(require('./node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs').hashSync('123456', 10))")
docker exec supabase-db-trampai psql -U postgres -d postgres -c "UPDATE users SET password = '$HASH' WHERE email = 'henriquelinharesjunqueira@gmail.com';"
