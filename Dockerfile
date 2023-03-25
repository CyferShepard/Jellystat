FROM node:slim

RUN mkdir /app
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY ./ ./

EXPOSE 3000

CMD ["npm", "run", "start-app"]

