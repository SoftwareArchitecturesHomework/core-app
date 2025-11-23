# 1. Alap image
FROM node:20-bookworm-slim

# 2. Környezeti változók beállítása a Nuxt számára
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# 3. pnpm telepítése
RUN npm install -g pnpm

# 4. Munkakönyvtár beállítása
WORKDIR /app

# 5. Függőségek másolása és telepítése
# Először csak a package.json és pnpm fájlokat másoljuk a jobb cache-elés érdekében.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 6. Telepítés
RUN pnpm install

# 7. A teljes projektkód másolása
COPY . .

# 7.5. Prisma Client generálása
RUN pnpm prisma generate

# 8. Port megnyitása
EXPOSE 3000

# 9. Fejlesztői szerver indítása
CMD ["pnpm", "run", "dev"]