FROM node:20-alpine

# Install mariadb-client, bash, and build dependencies for native modules
RUN apk add --no-cache mariadb-client bash python3 make g++

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Rebuild native modules for Alpine Linux
RUN npm rebuild bcrypt --build-from-source

# Copy application source code
COPY . .

# Copy and set permissions for entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
