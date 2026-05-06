# Button System Documentation

## Overview

The application uses centralized button styling.

Technologies:

- Tailwind CSS
- Shadcn UI
- class-variance-authority

---

## Main File

```txt
src/components/ui/button.tsx
```

---

## Rules

- Reuse variants whenever possible
- Avoid inline styling
- Use centralized variants
- Use theme variables for colors

---

## Example

```tsx
<Button variant="default">Save</Button>
<Button variant="destructive">Delete</Button>
```
```