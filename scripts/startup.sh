#!/usr/bin/env bash
set -e

# Unified startup script for all database types and environments
# Environment variables:
#   DB_TYPE: relational | document (default: relational)
#   ENV_MODE: dev | test | ci | prod (default: dev)

DB_TYPE=${DB_TYPE:-relational}
ENV_MODE=${ENV_MODE:-dev}

echo "========================================"
echo "Starting application..."
echo "DB_TYPE: $DB_TYPE"
echo "ENV_MODE: $ENV_MODE"
echo "========================================"

# Wait for database
if [ "$DB_TYPE" = "document" ]; then
  echo "Waiting for MongoDB..."
  /opt/wait-for-it.sh mongo:27017 -t 60
else
  echo "Waiting for PostgreSQL..."
  /opt/wait-for-it.sh postgres:5432 -t 60
fi

# Wait for mail service (not in prod)
if [ "$ENV_MODE" != "prod" ]; then
  echo "Waiting for mail service..."
  /opt/wait-for-it.sh maildev:1025 -t 30 || true
fi

# Wait for Redis if enabled
if [ -n "$REDIS_HOST" ] && [ "$REDIS_ENABLED" = "true" ]; then
  echo "Waiting for Redis..."
  /opt/wait-for-it.sh ${REDIS_HOST}:${REDIS_PORT:-6379} -t 30 || true
fi

# Install dependencies for test mode (source is mounted)
if [ "$ENV_MODE" = "test" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build for CI mode if not already built
if [ "$ENV_MODE" = "ci" ] && [ ! -d "dist" ]; then
  echo "Building application..."
  npm run build
fi

# Run migrations (only for relational database)
if [ "$DB_TYPE" = "relational" ]; then
  echo "Running database migrations..."
  if [ "$ENV_MODE" = "prod" ]; then
    npm run migration:run:prod
  else
    npm run migration:run
  fi
fi

# Run seed data (skip in production)
if [ "$ENV_MODE" != "prod" ]; then
  echo "Running seed data..."
  npm run seed:run:${DB_TYPE}
else
  echo "Skipping seed data in production mode"
fi

# Start application based on environment
case $ENV_MODE in
  dev)
    echo "Starting in development mode..."
    npm run start:dev
    ;;
  test)
    echo "Starting in test mode..."
    npm run start:dev
    ;;
  ci)
    echo "Starting in CI mode..."
    npm run start:prod > /tmp/app.log 2>&1 &
    APP_PID=$!

    echo "Waiting for application to be ready..."
    if ! /opt/wait-for-it.sh localhost:3000 -t 120; then
      echo "========================================"
      echo "Application failed to start. Logs:"
      echo "========================================"
      cat /tmp/app.log || true
      exit 1
    fi

    echo "Running E2E tests..."
    npm run test:e2e -- --runInBand

    # Cleanup
    kill $APP_PID 2>/dev/null || true
    ;;
  prod|*)
    echo "Starting in production mode..."
    npm run start:prod
    ;;
esac
