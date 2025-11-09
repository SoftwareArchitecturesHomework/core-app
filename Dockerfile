# 1. Alap image
FROM node:20-bookworm-slim

# 2. Környezeti változók beállítása a Nuxt számára
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# 3. Munkakönyvtár beállítása
WORKDIR /app


# 4. Függőségek másolása és telepítése
# Először csak a package.json fájlokat másoljuk a jobb cache-elés érdekében.
COPY package*.json ./

# 5. Telepítés
RUN npm install

# 6. A teljes projektkód másolása
COPY . .

# 7. Port megnyitása
EXPOSE 3000

# 8. Fejlesztői szerver indítása
CMD [ "npm", "run", "dev" ]