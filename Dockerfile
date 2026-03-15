FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to cache npm install
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy Prisma schema and generate Prisma client
# This step is required for Prisma to work properly in production
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
