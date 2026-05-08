# Database Documentation

## Database Stack

The project uses the following database technologies:

* MariaDB
* Prisma ORM
* Railway database hosting
* Docker local database environments

---

# Purpose

This document explains how database changes should be handled within the project.

The goal is to keep:

* the database structure,
* Prisma schema,
* application code,
* and deployment environments

consistent and maintainable.

---

# Database Rules

* Always use migrations
* Never modify production data manually
* Always test locally first
* Use PascalCase for table names
* Use camelCase for column names
* Always define foreign keys
* Document important schema changes
* Verify existing data before destructive changes

---

# Naming Conventions

## Table Naming

Use PascalCase and singular names.

Examples:

```txt
Material
Employee
TimeRegistry
EmployeeOvertime
```

---

## Column Naming

Use camelCase.

Examples:

```txt
createdAt
updatedAt
employeeId
serialNumber
```

---

# Migration Workflow

## Step 1

Modify the Prisma schema.

---

## Step 2

Generate a migration.

```bash
pnpm prisma migrate dev --name add_new_feature
```

---

## Step 3

Test the migration locally.

Verify:

* Existing data still works
* Relations remain valid
* No Prisma errors occur
* No TypeScript errors occur

---

## Step 4

Update the application code if necessary.

Possible changes:

* Forms
* Validation
* API routes
* Server actions
* Prisma queries
* Frontend tables
* TypeScript types

---

## Step 5

Deploy through Railway.

---

# Example SQL

## Add a column

```sql
ALTER TABLE Material
ADD COLUMN serialNumber VARCHAR(255) NULL;
```

---

## Add a relation

```sql
ALTER TABLE EmployeeOvertime
ADD CONSTRAINT fk_employee
FOREIGN KEY (employeeId)
REFERENCES Employee(id);
```

---

# Dangerous Actions

Be extra careful with:

* DROP TABLE
* DROP COLUMN
* DELETE without WHERE
* UPDATE without WHERE
* Primary key changes
* Foreign key changes
* Datatype changes on existing data

Always create a backup before destructive changes.

---

# Forbidden Actions

* Direct production edits
* Manual schema changes outside migrations
* Deleting tables without backups
* Running destructive SQL without testing
* Skipping Prisma synchronization

---

# Prisma Synchronization

After database changes:

```bash
pnpm prisma db pull
```

If needed:

```bash
pnpm prisma generate
```

Always verify:

* Relations
* Datatypes
* New fields
* Removed fields
* Prisma model consistency

---

# Testing Checklist

Before deployment verify:

* Migrations run without errors
* Existing data remains intact
* New fields can be created
* Forms still work
* API routes still work
* Prisma generates correctly
* TypeScript builds successfully

Useful commands:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm run build
```
