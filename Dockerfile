FROM node:23.1-alpine3.18

WORKDIR /app

COPY package* .
COPY tsconfig.json .

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
