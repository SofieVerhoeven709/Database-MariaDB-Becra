# System Architecture

## Overview

```txt
User
 ↓
React Frontend
 ↓
Next.js API Routes
 ↓
Prisma ORM
 ↓
MariaDB
```

---

## Frontend

Responsible for:

- User interface
- Forms
- Navigation
- Dashboard logic
- API communication

Main technologies:

- React
- Next.js
- Tailwind CSS
- Shadcn UI

---

## Backend

Responsible for:

- API routes
- Business logic
- Authentication
- Database communication

Main technologies:

- Node.js
- Prisma
- Next.js API routes

---

## Database

MariaDB stores:

- Users
- Departments
- Actions
- Application data

---

## Hosting

Railway hosts:

- Frontend
- Backend
- Database services
