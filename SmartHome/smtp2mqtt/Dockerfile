FROM node:25-alpine

# Create app directory
WORKDIR /smtp2mqtt

# Install app dependencies
COPY package.json tsconfig.json eslint.config.js ./
RUN npm install

# Copy app source code
COPY ./src/smtp2mqtt.ts ./src/

# build application
RUN npm run build

EXPOSE 2525
CMD [ "node", "/smtp2mqtt/dist/smtp2mqtt.js" ]
