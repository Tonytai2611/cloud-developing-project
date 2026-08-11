# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the React app with increased memory
ENV NODE_OPTIONS=--max-old-space-size=4096

ARG REACT_APP_API_BASE_URL
ARG REACT_APP_WEBSOCKET_URL
ARG REACT_APP_AWS_REGION
ARG REACT_APP_COGNITO_USER_POOL_ID
ARG REACT_APP_COGNITO_CLIENT_ID
ARG REACT_APP_COGNITO_CLIENT_SECRET
ARG REACT_APP_DEFAULT_ADMIN_EMAIL
ARG REACT_APP_NEWSLETTER_ENDPOINT
ARG REACT_APP_CONTACT_EMAIL

ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_WEBSOCKET_URL=$REACT_APP_WEBSOCKET_URL
ENV REACT_APP_AWS_REGION=$REACT_APP_AWS_REGION
ENV REACT_APP_COGNITO_USER_POOL_ID=$REACT_APP_COGNITO_USER_POOL_ID
ENV REACT_APP_COGNITO_CLIENT_ID=$REACT_APP_COGNITO_CLIENT_ID
ENV REACT_APP_COGNITO_CLIENT_SECRET=$REACT_APP_COGNITO_CLIENT_SECRET
ENV REACT_APP_DEFAULT_ADMIN_EMAIL=$REACT_APP_DEFAULT_ADMIN_EMAIL
ENV REACT_APP_NEWSLETTER_ENDPOINT=$REACT_APP_NEWSLETTER_ENDPOINT
ENV REACT_APP_CONTACT_EMAIL=$REACT_APP_CONTACT_EMAIL

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config template. The official nginx image renders env vars on startup.
COPY nginx.conf /etc/nginx/templates/default.conf.template

ENV API_UPSTREAM_HOST=api
ENV API_UPSTREAM_PORT=3001

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
