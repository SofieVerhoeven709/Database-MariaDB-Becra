#!/bin/bash

# Start MariaDB in background
docker-entrypoint.sh mariadbd &
MARIADB_PID=$!

# Wait for it to be ready
echo "Waiting for MariaDB to be ready..."
until mariadb -u root -p"${MARIADB_ROOT_PASSWORD}" -e "SELECT 1" &>/dev/null; do
  sleep 2
done

echo "Running alter.sql..."
mariadb -u root -p"${MARIADB_ROOT_PASSWORD}" BecraBV < /alter.sql

echo "Alter complete."

wait $MARIADB_PID
```

Make sure your project structure looks like:
```
├── Dockerfile
├── db-start.sh
├── init.sql
└── alter.sql