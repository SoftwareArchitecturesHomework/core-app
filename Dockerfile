FROM node:krypton-alpine

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

RUN npm install -g pnpm

WORKDIR /app

# Cache optimized layers
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install

COPY prisma ./prisma
RUN pnpm prisma generate

COPY . .

EXPOSE 3000
CMD ["pnpm", "run", "dev"]
