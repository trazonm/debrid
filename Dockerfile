# Use the official Node.js 18 image as the base
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files, including sw-precache-config.js
COPY . .

# Generate the service worker
RUN npm run build:sw

# Verify that sw.js exists
RUN ls -la /app

# Expose the port your app runs on
EXPOSE 5001

# Start the application
CMD ["node", "app.js"]
