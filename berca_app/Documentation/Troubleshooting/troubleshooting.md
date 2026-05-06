# Troubleshooting

## Railway Deployment Failed

Possible causes:

- Missing environment variables
- Incorrect Docker configuration
- Prisma migration failure
- Incorrect root directory

---

## pnpm install fails

Possible causes:

- Incorrect Node.js version
- Corrupted lockfile
- Missing permissions

---

## Database Connection Failed

Check:

- DATABASE_URL
- Railway private network
- Database service status
- Firewall settings

---

## Docker Problems

Try:

```bash
docker-compose down
docker-compose up -d
```