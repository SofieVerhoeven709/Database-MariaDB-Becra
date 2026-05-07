# Guide: adjusting a department (extra button + color)

> Language: [NL](../../../../OneDrive/Desktop/Becra/docs/handleiding-departement-aanpassen.md) | **EN**

In this app, **departments** are mainly UI tiles (cards) that link to a department page.
On that page you’ll see tiles again, representing “actions” inside that department.

This guide covers two common questions:

1. **Add an extra button/tile** under a department (e.g. a new action inside the department)
2. **Change the color of a department** (does not yet work)

---

## Quick overview (where is what?)

### Department overview (tiles)
- Component: `src/components/custom/departmentGrid.tsx`
- Data comes from: `src/app/api/departments/route.ts` (Prisma → `Department` table)

### Department detail (actions/tiles inside a department)
- Page: `src/app/(app)/departments/[departmentId]/page.tsx`
- Action tiles: `src/components/custom/departmentActionGrid.tsx`
- Config (which actions exist): `src/extra/departmentActions.ts`

---

## 1) Add an extra button/tile under a department

In this codebase, “an extra button under a department” usually means one of these two things:

- **A. A new action tile on the department page** (most common)
- **B. An extra button on the department tile in the overview** (dashboard)

### A) New action tile on the department page (recommended)

On the department page (`/departments/<id>`), action tiles are built from `DEPARTMENT_ACTIONS`.

#### Step 1 — Add the action in `DEPARTMENT_ACTIONS`
File: `src/extra/departmentActions.ts`

Find the object:

- `export const DEPARTMENT_ACTIONS: Record<string, DepartmentAction[]> = { ... }`

Then add a new item in the correct block.

Important:
- The key is the **department name** from the database/seed (e.g. `HR`, `Engineering`, `General`, …)
- `id` becomes part of the URL: `/departments/<departmentId>/<id>`

Example (conceptual):
- Add under `HR: [ ... ]` or under `General: [ ... ]`
- Pick a unique `id` like `trainingPlan`

Fields:
- `id`: unique, preferably **camelCase** (that’s common in this repo)
- `name`: label shown on the tile
- `description`: short explanation shown under the title
- `icon`: icon name (comes from `src/extra/icons.ts`)
- `owner`: free string (currently mostly used as metadata)

#### Step 2 — Create the page for the new action route

The tile links to:

- `/departments/${department.id}/${action.id}`

So you also need a page at:

- `src/app/(app)/departments/[departmentId]/<action.id>/page.tsx`

You can start with a placeholder similar to existing routes (e.g. `admin`, `strategy`).
Look for examples in:
- `src/app/(app)/departments/[departmentId]/admin/page.tsx`
- `src/app/(app)/departments/[departmentId]/strategy/page.tsx`

#### Step 3 (optional) — Add a breadcrumb label

In the navbar/breadcrumbs, known segments are translated to nicer labels.
If you want your new segment to show a clean name, add it here:

- `src/components/custom/dashboardNavbar.tsx` → `SEGMENT_LABELS`

Example:
- `trainingPlan: 'Training plan'`

#### Step 4 — Testing

- Open `/departments/<a-department-id>`
- Check whether the new action tile shows up
- Click it and confirm the new route works

---

### B) Extra button on the department tile in the overview (dashboard)

The department tiles in the overview are built in `src/components/custom/departmentGrid.tsx` as one big `<Link>` card.

If you want an extra button “under” that tile, be careful:

- **You cannot nest a `<button>` or a second `<a>` inside a `<Link>`** (HTML/Next.js issues)

Practical options:

1. **Turn the card into a `<div>`**, and put inside:
   - a `<Link>` for the title/main action
   - and below/next to it a `<Button>` or extra `<Link>` for the additional action

2. Keep it consistent: if it’s “an action within the department”, option **A** is usually cleaner.

---

## 2) Change the department color

In this app, department color is mostly **data-driven**: each department has a `color` (hex) in the database.
The UI uses that color as an accent (icon color and background tint).

### Where is the color used?

- `src/components/custom/departmentGrid.tsx`
- `src/components/custom/departmentActionGrid.tsx`

There, `dept.color` / `department.color` is converted into:
- `--dept-accent` (the actual color)
- `--dept-bg` and `--dept-bg-hover` (the same color with transparency)

### Option 1 — Change the color in the seed (dev)

If you use seeding locally, change the color in:
- `prisma/seedDev.ts` → `ALL_DEPARTMENTS`

Example:
- `color: '#00b0f0'`

Notes:
- Prefer **#RRGGBB** (7 characters)
- Avoid short hex `#FFF` (it won’t work with the transparency trick `#RRGGBBAA`)

Then re-seed (exact command depends on your workflow; often something like `pnpm prisma db seed`).

### Option 2 — Change the color in the database

In Prisma this field is:
- model `Department` → `color String?`

So if you have an admin tool or run a SQL update, you can simply update `Department.color`.

### Option 3 — Adjust styling (how the color “feels” in the UI)

If you want the color to be more subtle/stronger, change the alpha values in:
- `departmentGrid.tsx` and/or `departmentActionGrid.tsx`

You’ll see something like:
- `${accentColor}1F` (light background)
- `${accentColor}2E` (hover)

Higher alpha = stronger effect.

---

## 3) Useful search terms

- `<DepartmentGrid` / `DepartmentGrid(`
- `DepartmentActionGrid`
- `DEPARTMENT_ACTIONS`
- `href="/departments/"`
- `SEGMENT_LABELS`

---

## 4) Quick test commands

From the project root (`berca_app`):

```powershell
pnpm dev
```

Optional:

```powershell
pnpm lint
pnpm build
```

