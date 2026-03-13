#!/bin/bash

docker-entrypoint.sh mariadbd &
MARIADB_PID=$!

echo "Waiting for MariaDB to be ready..."
until mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1" &>/dev/null; do
  sleep 2
done

echo "Running alter.sql..."
mariadb -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < /alter.sql
echo "Alter complete."

wait $MARIADB_PID