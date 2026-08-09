#!/bin/sh
# Upstream's CMD is `npm run start-docker`, i.e. check-db -> update-tracker ->
# start-server. The only change here is that the admin account is claimed from
# the environment between the migration step and the server binding the port.
set -e

if [ -z "$UMAMI_ADMIN_PASSWORD" ]; then
    echo "[railway] UMAMI_ADMIN_PASSWORD is empty - refusing to start."
    exit 1
fi

cd /app

echo "[railway] running database check and migrations"
npm run check-db

echo "[railway] seeding admin credentials"
node scripts/railway-seed-admin.cjs

echo "[railway] updating tracker script"
npm run update-tracker

echo "[railway] starting server"
exec node server.js
