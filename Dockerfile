# Stage 1: Build the application
FROM node:slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force
RUN npm install

COPY ./ ./

# Stage 2: Create the production image
FROM node:slim

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3000

CMD ["npm", "run", "start"]
