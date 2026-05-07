# Railway Deployment

## Services

| Service | Purpose |
|---|---|
| frontend | Frontend hosting |
| backend | API hosting |
| mariadb | Database hosting |

---

## Deployment Flow

```txt
GitHub Push
 ↓
Railway Build
 ↓
Docker Build
 ↓
Production Deployment
```

---

## Important Rules

- Use Railway private networking
- Never expose database publicly
- Verify environment variables
- Monitor logs after deployment

---

## Environment Variables

```env
DATABASE_URL=
PRIVATE_KEY=
PUBLIC_KEY=
```
```