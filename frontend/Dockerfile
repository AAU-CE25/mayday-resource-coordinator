# Use Node 22 (Vite requires Node >= 20.19)
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies first (better cache)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# Start Vite dev server, binding to all interfaces
CMD ["npm", "run", "dev", "--", "--host"]
