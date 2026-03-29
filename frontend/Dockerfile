FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# We mount the src code via volume in compose
COPY . .

# Start the dev server and expose it on all interfaces so our local machine can reach it
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
