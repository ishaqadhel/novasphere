#!/bin/bash
set -e

echo "Waiting for MySQL to be ready..."
echo "Connecting to: $DB_HOST:$DB_PORT as $DB_USER"

# Wait for MySQL to be ready
ATTEMPTS=0
MAX_ATTEMPTS=10
until mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" --skip-ssl -e "SELECT 1" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    echo "Failed to connect to MySQL after $MAX_ATTEMPTS attempts"
    echo "Showing last error:"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" --skip-ssl -e "SELECT 1"
    exit 1
  fi
  echo "MySQL is unavailable - sleeping (attempt $ATTEMPTS/$MAX_ATTEMPTS)"
  sleep 2
done

echo "MySQL is up and ready!"

# Check if database has been initialized by checking if any tables exist
TABLE_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" --skip-ssl -sse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';")

if [ "$TABLE_COUNT" -eq 0 ]; then
  echo "Database is empty. Running first-time initialization..."
  echo "Running npm run db:full-reset (migration, seed, etl)..."
  npm run db:full-reset
  echo "Database initialization completed successfully!"
else
  echo "Database already initialized. Skipping db:full-reset."
fi

echo "Starting application..."
exec npm start
