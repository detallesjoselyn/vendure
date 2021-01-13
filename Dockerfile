FROM node:12
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package.json ./
COPY --chown=node:node yarn.lock ./
USER node
RUN yarn
COPY --chown=node:node . .
EXPOSE 3000
CMD [ "yarn", "build" ]
CMD [ "yarn", "start" ]
