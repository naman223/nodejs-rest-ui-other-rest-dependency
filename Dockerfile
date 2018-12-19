FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Below steps needed to build behind the Oracle proxy
RUN npm config set proxy http://148.87.19.20:80
RUN npm config set https-proxy http://148.87.19.20:80

RUN npm install express ejs request body-parser express-session

# Bundle app source
COPY . .

EXPOSE 8090
CMD [ "npm", "start" ]
