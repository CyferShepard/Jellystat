# Stage 1: Build the application
FROM node:lts-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force
RUN npm install

COPY ./ ./
COPY entry.sh ./

# Build the application
RUN npm run build

# Stage 2: Create the production image
FROM node:slim

RUN apt-get update && \
    apt-get install -yqq --no-install-recommends wget && \
    apt-get autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app .
COPY --chmod=755 entry.sh /entry.sh

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=10s \
            --retries=3 \
            CMD [ "/usr/bin/wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/auth/isconfigured" ]

EXPOSE 3000

CMD ["/entry.sh"]
