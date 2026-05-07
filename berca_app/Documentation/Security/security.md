# Security Documentation

## Rules

- Never commit `.env` files
- Store secrets in Railway variables
- Validate all API input
- Sanitize database input
- Use least-privilege access

---

## Forbidden Actions

- Sharing production credentials
- Exposing database publicly
- Hardcoding secrets in source code

---

## Environment Variables

Secrets must only exist in:

- Railway variables
- Local `.env` files

Never inside Git repositories.