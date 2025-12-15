FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src/ ./src/
COPY openapi.yaml ./

ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/index.js"]
