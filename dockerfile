FROM node:20-alpine

# 1. ADD 'dos2unix' to the list of installed packages
RUN apk add --no-cache mariadb-client bash python3 make g++ dos2unix

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Rebuild native modules for Alpine Linux
RUN npm rebuild bcrypt --build-from-source

# Copy application source code
COPY . .

# Copy the entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/

# 2. RUN dos2unix to force correct line endings, THEN make it executable
RUN dos2unix /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
