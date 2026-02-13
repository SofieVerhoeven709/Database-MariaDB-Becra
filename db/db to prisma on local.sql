-- Make sure the user exists
CREATE USER IF NOT EXISTS 'app_user'@'localhost'
IDENTIFIED BY 'app_password';

-- Grant full access to your DB
GRANT ALL PRIVILEGES ON BecraLocal.* TO 'app_user'@'localhost';
GRANT ALL PRIVILEGES ON BecraLocal.* TO 'app_user'@'%';

-- Apply changes
FLUSH PRIVILEGES;

SHOW GRANTS FOR 'app_user'@'localhost';

-- run this in webstorm project to drag local db into prisma schema
pnpm prisma db pull