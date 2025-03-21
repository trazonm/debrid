# Use the official Node.js 18 image as the base
FROM node:18

# Set the working directory
WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Generate the version.json file with the current timestamp
RUN echo "{\"version\": \"$(date +%s)\"}" > version.json

# Copy all application files
COPY . .

# Generate the CSS
RUN npm run build:css

# Generate the service worker with versioning
RUN npm run build:sw

# Expose the port your app runs on
EXPOSE 5001

# Start the application
CMD ["node", "app.js"]
