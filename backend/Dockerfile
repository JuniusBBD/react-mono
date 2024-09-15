FROM node:22-alpine3.19

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml for pnpm
COPY package*.json .
COPY pnpm-lock.yaml .

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 8080

CMD [ "pnpm", "start" ]
