FROM node:18.20.4-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN yarn config set network-timeout 550000 -g && yarn install
COPY . .
RUN yarn build && ls -la build # List build directory to confirm files
EXPOSE 5000
CMD [ "yarn", "start" ]