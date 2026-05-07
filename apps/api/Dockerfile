FROM node:22-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos de configuração do workspace
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/api-zod/package.json ./packages/api-zod/
COPY apps/api/package.json ./apps/api/

# Instalar dependências
RUN pnpm config set ignore-scripts false
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY packages/db ./packages/db
COPY packages/api-zod ./packages/api-zod
COPY apps/api ./apps/api
COPY tsconfig.base.json tsconfig.json ./

# Build
RUN pnpm --filter @workspace/api-server run build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN mkdir -p public/uploads

EXPOSE 3000

CMD ["node", "dist/index.mjs"]
