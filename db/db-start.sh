#!/bin/bash

# Start MariaDB in background
docker-entrypoint.sh mariadbd &
MARIADB_PID=$!

# Wait for it to be ready using the actual credentials
echo "Waiting for MariaDB to be ready..."
until mariadb -u "${MARIADB_USER}" -p"${MARIADB_PASSWORD}" "${MARIADB_DATABASE}" -e "SELECT 1" &>/dev/null; do
  sleep 2
done

echo "Running alter.sql..."
mariadb -u "${MARIADB_USER}" -p"${MARIADB_PASSWORD}" "${MARIADB_DATABASE}" < /alter.sql
echo "Alter complete."

wait $MARIADB_PID