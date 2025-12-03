FROM node:krypton-alpine AS base
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY prisma ./prisma
RUN pnpm exec prisma generate
COPY . .
RUN pnpm run build

FROM base AS migrator
COPY migrator-entry.sh .
RUN chmod +x ./migrator-entry.sh
ENTRYPOINT ["./migrator-entry.sh"]

COPY pnpm-workspace.yaml .
RUN pnpm init
RUN pnpm install tsx prisma @prisma/client @prisma/adapter-pg bcrypt
COPY prisma prisma
COPY prisma.config.ts .
COPY tsconfig.seed.json .
RUN pnpm exec prisma generate

FROM base AS production
COPY ./entrypoint.sh ./
RUN chmod +x ./entrypoint.sh
EXPOSE 3000
ENTRYPOINT [ "./entrypoint.sh" ]
CMD ["node", ".output/server/index.mjs"]

COPY --from=build /app/.output /app/.output
