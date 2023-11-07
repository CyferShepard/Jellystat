# pull the Node.js Docker image
FROM node:lts-alpine

# update the package index
RUN apk update && apk add --no-cache tzdata

# set timezone data
ENV TZ=Asia/Kuala_Lumpur

# create app directory
WORKDIR /usr/src/app

# bundle app source
COPY . .

# install node_modules, build client React JS, delete node_modules server side, prune image for production, clear npm cache, delete unnecessary folder client side
RUN npm install && \
    npm run build && \
    npm cache clean --force && \
    rm -rf src

# app run on port 3000
EXPOSE 3000

# run the server
CMD ["npm", "start"]