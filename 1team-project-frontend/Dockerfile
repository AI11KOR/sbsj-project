FROM node:20-alpine AS builder 

# ✅ 빌드 타임 env (여기 추가/확장)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FLASK_URL
ARG NEXT_PUBLIC_KAKAO_MAP_KEY
ARG NEXT_PUBLIC_RAG_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_FLASK_URL=$NEXT_PUBLIC_FLASK_URL
ENV NEXT_PUBLIC_KAKAO_MAP_KEY=$NEXT_PUBLIC_KAKAO_MAP_KEY
ENV NEXT_PUBLIC_RAG_URL=$NEXT_PUBLIC_RAG_URL

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

RUN npm install --omit=dev

EXPOSE 3000
CMD ["npm", "run", "start"]
