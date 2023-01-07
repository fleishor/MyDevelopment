FROM node:19.3.0-alpine3.16

# Create app directory
WORKDIR /smtp2mqtt

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY ./dist/smtp2mqtt.js .

EXPOSE 3001
CMD [ "node", "/smtp2mqtt/smtp2mqtt.js" ]
