#!/bin/sh
# Imports the original Cohort 2 programs, graduates and certificate IDs. Safe to re-run.
# Usage: docker exec <container> /app/migrate/seed.sh
set -e
cd /app/migrate
node node_modules/prisma/build/index.js db execute --file prisma/seed.sql
echo "Seed complete."
