# Stage 1: Build the application
FROM node:slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force
RUN npm install
COPY ./src ./src
COPY ./public ./public
RUN npm run build


# Stage 2: Create the production image
FROM node:slim

WORKDIR /app

COPY package.json .
COPY --from=builder /app/node_modules/ ./node_modules
COPY /backend ./backend
COPY --from=builder /app/build ./static

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start-server"]
