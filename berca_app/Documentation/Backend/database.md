# Database Documentation

## Database Stack

- MariaDB
- Prisma ORM
- Railway database hosting

---

## Rules

- Always use migrations
- Never modify production data manually
- Always test locally first
- Use snake_case for SQL fields
- Always define foreign keys

---

## Migration Workflow

### Step 1

Modify Prisma schema.

### Step 2

Generate migration.

```bash
pnpm prisma migrate dev --name add_new_feature
```

## Example SQL

```sql
ALTER TABLE users
ADD COLUMN role VARCHAR(50);
```

---

## Forbidden Actions

- Direct production edits
- Deleting tables without backup
- Manual schema changes outside migrations
```

---