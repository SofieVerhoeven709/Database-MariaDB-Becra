# Department System Documentation

## Main Files

```txt
src/components/custom/departmentGrid.tsx
src/components/custom/departmentActionGrid.tsx
src/extra/departmentActions.ts
```

---

## Add New Action

### Step 1

Add configuration in:

```txt
src/extra/departmentActions.ts
```

### Step 2

Create page:

```txt
src/app/(app)/departments/[departmentId]/<actionId>/page.tsx
```

### Step 3

Test navigation.

---

## Department Colors

Can be configured:

- Via seed files
- Via database
- Via UI components
```