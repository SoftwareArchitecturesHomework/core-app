FROM node:krypton-alpine

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV NODE_ENV=production

RUN npm install -g pnpm

WORKDIR /app

# Cache optimized layers
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install

COPY prisma ./prisma
RUN pnpx prisma generate


COPY . .
RUN pnpm run build
EXPOSE 3000

CMD ["pnpx", "prisma", "migrate", "||", "node", ".output/server/index.mjs"]
