# Becra Project Documentation

## Overview

This repository contains the Becra software platform and its related services.
The project consists of:

- A React / Next.js frontend
- Backend API routes
- MariaDB databases
- Railway deployment infrastructure
- Docker-based local development environments
- Android mobile integration support

The goal of this documentation is to provide developers with a complete overview of:

- Project architecture
- Required software
- Development workflows
- Deployment procedures
- Database management
- Coding standards
- Troubleshooting guidelines

---

# Project Architecture

```txt
User
 ↓
React / Next.js Frontend
 ↓
API Routes
 ↓
Prisma ORM
 ↓
MariaDB Database
```

---

# Main Technologies

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Next.js | Frontend and backend framework |
| Node.js | Backend runtime |
| MariaDB | Database storage |
| Prisma | Database ORM layer |
| Railway | Hosting and deployment |
| Docker | Local container environments |
| GitHub | Version control |
| pnpm | Dependency management |
| Android Studio | Mobile development |

---

# Tool Responsibilities

| Software | Primary Use | Used By | Purpose |
|---|---|---|---|
| WebStorm | React and TypeScript development | Developers | Main IDE for application development |
| Visual Studio Code | Database management and lightweight editing | Developers | SQLTools extensions and quick edits |
| Railway | Hosting and deployment | Developers / DevOps | Hosting the application and services |
| GitHub | Version control and collaboration | Entire team | Source control and code collaboration |
| Docker Desktop | Local containers and databases | Developers | Ensures consistent local environments |
| MariaDB | Database management | Backend developers | Stores application data |
| Node.js | Backend runtime | Backend developers | Executes server-side logic |
| pnpm | Package management | Developers | Dependency installation and management |
| Android Studio | Android app testing and development | Mobile developers | Emulator and mobile debugging |
| Prisma | Database ORM layer | Backend developers | Communication between backend and database |

---

# Software Restrictions

| Software | Should NOT Be Used For |
|---|---|
| WebStorm | Database hosting or deployment |
| Visual Studio Code | Production deployment |
| Railway | Editing source code |
| GitHub Desktop | Database management |
| Docker | Permanent production hosting |

---

# Typical Development Workflow

```txt
Developer writes code in WebStorm
↓
Code is pushed to GitHub
↓
Railway automatically deploys the application
↓
MariaDB stores application data
↓
Docker provides a consistent local development environment
```

---

# Repository Structure

```txt
/docs
 ├── onboarding/
 ├── frontend/
 ├── backend/
 ├── architecture/
 └── troubleshooting/

/src
 ├── app/
 ├── components/
 ├── lib/
 ├── api/
 └── utils/
```

---

# Local Development Setup

## Requirements

- Node.js 20+
- pnpm
- Docker Desktop
- GitHub Desktop
- WebStorm or Visual Studio Code
- Railway account access

---

## Installation

### Clone repository

```bash
git clone <repository-url>
cd <project-folder>
```

### Install dependencies

```bash
pnpm install
```

### Environment variables

Create a `.env` file based on `.env.example`.

Example:

```env
DATABASE_URL=
PRIVATE_KEY=
PUBLIC_KEY=
```

---

## Railway connection

```bash
railway login
railway link
```

---

## Start development server

```bash
pnpm dev
```

---

# Database Management

## Database workflow

```txt
Frontend
 ↓
API Route
 ↓
Prisma
 ↓
MariaDB
```

---

## Database rules

- Always use migrations
- Never modify production data manually
- Use snake_case for SQL fields
- Always define foreign keys
- Test migrations locally first

---

## Prisma migration example

```bash
pnpm prisma migrate dev --name add_new_feature
```

---

# Frontend Guidelines

## General rules

- Reusable UI belongs in `/components`
- Avoid duplicated styling
- Use centralized variants where possible
- Keep business logic outside UI components
- Use TypeScript typing consistently

---

## Button system

The application uses:

- Shadcn UI principles
- Tailwind CSS
- class-variance-authority (CVA)

Button styling is centralized to maintain consistency.

---

# Git Workflow

## Branch rules

- Never work directly on `main`
- Create feature branches
- Use pull requests
- Prefer peer review before merging

---

## Example workflow

```bash
git checkout -b feature/new-dashboard
```

```bash
git add .
git commit -m "Add new dashboard"
git push
```

---

# Railway Deployment

## Deployment flow

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

## Important rules

- Use Railway private networking for databases
- Never expose database services publicly
- Verify environment variables before deployment
- Monitor Railway logs after deployment

---

# Coding Standards

## TypeScript / React

- Use 2 spaces indentation
- Prefer single quotes
- Avoid unnecessary semicolons
- Use reusable components
- Keep files modular and maintainable

---

## SQL

- Use descriptive table names
- Use snake_case
- Avoid destructive queries without backups
- Document important schema changes

---

# Troubleshooting

## Railway deployment failed

Possible causes:

- Missing environment variables
- Incorrect Docker configuration
- Prisma migration failure
- Incorrect root directory

---

## pnpm install fails

Possible causes:

- Incorrect Node.js version
- Missing permissions
- Corrupted lockfile

Recommended solution:

```bash
pnpm install --force
```

---

# Security Rules

- Never commit `.env` files
- Store secrets in Railway variables
- Validate API input
- Sanitize database input
- Use least-privilege access where possible

---

# Documentation Structure

| Document | Purpose |
|---|---|
| onboarding.md | Local setup and requirements |
| coding-standards.md | Coding conventions |
| database.md | Database and migrations rules |
| api.md | API standards |
| development-flow.md | Development workflow |
| architecture.md | System architecture overview |
| deployment.md | Railway deployment instructions |
| troubleshooting.md | Common issue resolution |


---

# Important Notes

- Keep documentation updated when features change
- Prefer reusable systems over one-off solutions
- Centralize configuration where possible
- Maintain consistency across frontend and backend
- Always test locally before deployment

---

# Contact

For project access, deployment permissions, or infrastructure questions, you can always contact us if needed.

