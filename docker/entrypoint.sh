#!/bin/sh
set -e

# Apply pending Prisma migrations before starting (set RUN_MIGRATIONS=false to skip).
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Applying database migrations..."
  (cd /app/migrate && node node_modules/prisma/build/index.js migrate deploy)
fi

exec node server.js
