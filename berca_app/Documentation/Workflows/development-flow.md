# Development Workflow

## Typical Workflow

```txt
Developer writes code in WebStorm
↓
Code is pushed to GitHub
↓
Railway deploys automatically
↓
MariaDB stores application data
```

---

## Frontend Flow

```txt
React Component
 ↓
API Request
 ↓
API Route
 ↓
Prisma
 ↓
MariaDB
```

---

## Database Change Flow

```txt
Modify Prisma Schema
 ↓
Create Migration
 ↓
Test Locally
 ↓
Deploy to Railway
```