#!/bin/bash
# ================================================
#  TRAMPAÍ — Script de Deploy na VPS
#  Execute: chmod +x deploy.sh && ./deploy.sh
# ================================================

set -e

PROJECT_DIR="/home/trampai"
REPO_URL="https://github.com/hljunqueira/TRAMPAI-EXPO.git"

echo "🚀 Iniciando deploy do Trampaí..."

# 1. Criar pasta do projeto
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 2. Clonar ou atualizar o repositório
if [ -d ".git" ]; then
    echo "📥 Atualizando repositório..."
    git pull origin main
else
    echo "📥 Clonando repositório..."
    git clone $REPO_URL .
fi

# 3. Criar o .env se não existir
if [ ! -f ".env" ]; then
    echo "⚙️  Criando .env..."
    cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:Tramp@i2025!Secure@supabase-db-trampai:5432/postgres
JWT_SECRET=b7d4fea4028698c0ce725811194485643568bf92f904bdfdd2ccfa853ff8bbb2
POSTGRES_PASSWORD=Tramp@i2025!Secure
RESEND_API_KEY=sua_chave_resend_aqui
APP_URL=http://23.80.89.116:3007
SUPABASE_ANON_KEY=aLoJ7yb88SJ6HzRKSIqo61evvjUHZkjmLLg+2WsE4RuhkEUGX5eJwQGDmxmPa9VJkwfbndGu91OImnaBjuvM5A==
SUPABASE_SERVICE_ROLE_KEY=T08e2Go5+cN2FvOGp9Rrq8SDR2trztOfIXMsg+JeEh0POGClH18SrN6uJ02nRbOryS+ko1VLq0NyJFfS105IsA==
EXPO_PUBLIC_API_URL=http://23.80.89.116:3007
EOF
    echo "✅ .env criado. Edite com: nano /home/trampai/.env"
fi

# 4. Build e subir os containers
echo "🐳 Subindo containers Docker..."
docker compose pull
docker compose up -d --build

# 5. Aguardar banco de dados ficar saudável
echo "⏳ Aguardando banco de dados..."
until docker exec supabase-db-trampai pg_isready -U postgres; do
    sleep 3
done

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "🔗 Serviços disponíveis:"
echo "   API Trampaí:       http://23.80.89.116:3007"
echo "   Supabase Studio:   http://23.80.89.116:8031"
echo "   Supabase API:      http://23.80.89.116:8030"
echo "   Postgres DB:       23.80.89.116:5437"
