FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

# ✅ Prisma 엔진 (alpine musl용)
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

# ✅ 너의 output 경로(커스텀 prisma client)
COPY --from=builder /app/src/generated/prisma /app/dist/generated/prisma

# ✅ 빌드 결과
COPY --from=builder /app/dist ./dist

# ✅ 정적 리소스/문서
COPY --from=builder /app/src/res ./dist/res
COPY --from=builder /app/src/docs ./dist/docs

EXPOSE 8000
CMD ["node", "dist/index.js"]
