# Production-ready Dockerfile for Node.js application
FROM node:18-alpine

# Install dumb-init for proper signal handling (SIGTERM, SIGINT, etc.)
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files first for better layer caching
COPY --chown=nodejs:nodejs package*.json ./

# Install only production dependencies
# Use --no-audit and --no-fund to speed up install
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Copy application files with proper ownership
COPY --chown=nodejs:nodejs . .

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--max-old-space-size=512"

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Add labels for better image management
LABEL maintainer="event-calendar" \
      version="1.0" \
      description="Event Calendar Application"

# Health check to monitor container status
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "./bin/www"]

