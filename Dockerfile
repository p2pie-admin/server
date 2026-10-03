FROM node:18.20.4-alpine

WORKDIR /usr/src/app

# Lockfile pins versions that work on Node 18 (a fresh resolve pulls deps that need Node 20).
COPY package.json yarn.lock ./
RUN yarn config set network-timeout 550000 -g && yarn install --frozen-lockfile
COPY . .
RUN yarn build && ls -la build # List build directory to confirm files
EXPOSE 5000
CMD [ "yarn", "start" ]