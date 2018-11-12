FROM node:10.13.0-alpine

WORKDIR /usr/src/app

COPY  package.json package-lock.json ./

RUN npm install --only=prod

COPY . .

CMD ["npm", "start"]
