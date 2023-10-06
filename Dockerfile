# Stage 1: Build the application
FROM node:slim AS builder-front

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force
RUN npm install
COPY ./src ./src
COPY ./public ./public
RUN npm run build

FROM node:slim AS builder-server

WORKDIR /app

COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm cache clean --force
RUN npm install

# Stage 2: Create the production image
FROM node:slim

WORKDIR /app

COPY /backend ./backend/
COPY --from=builder-server /app/backend/node_modules/ ./backend/node_modules/
COPY --from=builder-front /app/build ./backend/static

WORKDIR /app/backend

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start-server"]
