# Use the official Node.js 18 image as the base
FROM node:18

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the sw-precache-config.js file
COPY sw-precache-config.js ./sw-precache-config.js

# Copy the rest of the application files
COPY . .

# Build the service worker
RUN npm run build:sw

# Expose the port your app runs on
EXPOSE 5001

# Start the application
CMD ["node", "app.js"]
