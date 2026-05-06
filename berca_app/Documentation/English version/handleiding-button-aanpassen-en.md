# Guide: customizing a Button

> Language: [NL](./handleiding-button-aanpassen.md) | **EN**

This codebase uses a central `Button` component (Shadcn UI style) with **variants** and **sizes** via *class-variance-authority (CVA)*.

## Checklist (quick overview)

- [ ] Find where the button is defined (`src/components/ui/button.tsx`).
- [ ] Decide whether you want to change something **globally** (all buttons) or **locally** (one specific place).
- [ ] Adjust either the **base styles** or a **variant/size**.
- [ ] Test in the UI with `pnpm dev`.
- [ ] (Optional) Add a new `variant` and replace one-off `className` overrides.

---

## 1) Where is the Button defined?

File:

- `src/components/ui/button.tsx`

Key parts:

- `buttonVariants`: Tailwind classes (base + variants + sizes)
- `Button`: the React component itself
- `asChild`: allows styling e.g. an `<a>` or `<Link>` as a button

The component also sets useful attributes:

- `data-slot="button"`
- `data-variant={variant}`
- `data-size={size}`

This can be handy if you later want to use *CSS selectors* (but usually CVA is enough).

---

## 2) Global vs local changes (decision helper)

### A. I want to change one specific button
Use `className` on that button.

Example:

```tsx
<Button className="bg-red-600 hover:bg-red-700">Verwijderen</Button>
```

Use this mainly for one-off exceptions.

### B. I want to change all buttons (or an entire category) consistently
Update `buttonVariants` in `src/components/ui/button.tsx` or add a new `variant`.

---

## 3) Adjusting base styling (applies to all variants)

In `button.tsx` there is a large base class string at the top, e.g.:

- layout: `inline-flex items-center justify-center gap-2`
- typography: `text-sm font-medium`
- rounding: `rounded-md`
- accessibility/focus: `focus-visible:ring-[3px] ...`
- disabled: `disabled:opacity-50`

When you want to change things like **border radius**, **focus ring**, **disabled behavior** or **icon spacing**, do it here.

Tip: prefer changing colors via theme tokens (see step 7) so everything (tabs, badges, etc.) stays consistent.

---

## 4) Adjusting existing variants

In `buttonVariants` → `variants.variant` you will find the variants:

- `default`
- `destructive`
- `outline`
- `secondary`
- `ghost`
- `link`

Example: if you want the `default` button to be greener, change the classes in `default:`.

Usage in code:

```tsx
<Button variant="default">Opslaan</Button>
<Button variant="outline">Annuleren</Button>
<Button variant="destructive">Verwijderen</Button>
```

---

## 5) Adjusting or adding sizes

In `buttonVariants` → `variants.size` you will find the sizes:

- `default`, `xs`, `sm`, `lg`
- `icon`, `icon-xs`, `icon-sm`, `icon-lg`

Usage in code:

```tsx
<Button size="xs">Klein</Button>
<Button size="lg">Groot</Button>
<Button size="icon" aria-label="Zoeken">
  <Search />
</Button>
```

If you want an additional size (e.g. `xl`), add it in `variants.size` and (optionally) make it the default via `defaultVariants`.

---

## 6) Adding a new variant (recommended)

Why? Instead of scattering `className` overrides everywhere, you keep styling centralized and consistent.

### Steps

1. Open `src/components/ui/button.tsx`
2. Add a key under `variants.variant`, e.g. `success`:

```ts
variant: {
  // ...
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
}
```

3. Then use it:

```tsx
<Button variant="success">Goedkeuren</Button>
```

### When should you use theme tokens instead?

If you want the variant to automatically participate in `dark` / `high-contrast`, it’s often cleaner to use CSS variables in `src/app/globals.css` (for example add `--success` + `--success-foreground`).

---

## 7) Adjusting theme colors (primary/accent/destructive)

The Button variants use tokens such as:

- `bg-primary`, `text-primary-foreground`
- `bg-accent`, `text-accent-foreground`
- `bg-destructive`

These tokens come from `src/app/globals.css` (CSS variables like `--primary`, `--accent`, ...).

So if you want **all** `primary` buttons to have a different color, this is often the best place.

---

## 8) Finding Buttons in the codebase

Useful search terms:

- `from "@/components/ui/button"`
- `<Button`
- `variant="` / `size="`

Goal: see if there are places with lots of `className` workarounds you can replace with one clean variant.

---

## 9) Link styled as a button (asChild)

If you want a button that is actually a link, `asChild` is often the cleanest option:

```tsx
import Link from "next/link"

<Button asChild>
  <Link href="/projects">Naar projecten</Link>
</Button>
```

You keep the `Button` styling, but the markup is semantically a link.

---

## 10) Quick testing

From the project root (`berca_app`):

```powershell
pnpm dev
```

Optional:

```powershell
pnpm lint
pnpm format
```

---

## Troubleshooting

### Tailwind changes don’t seem to apply

Check `tailwind.config.ts`. In this repo all code lives under `src/`.

If the `content` paths don’t point to `./src/**`, Tailwind classes may not be generated (correctly).

### `className` doesn’t behave as expected

`cn()` (in `src/lib/utils.ts`) uses `tailwind-merge`: it **deduplicates** conflicting Tailwind classes.

Example: if `buttonVariants` already sets `h-9` and you set `h-10`, usually only the last/strongest will remain. That’s typically desired, but it can explain “why my class disappears”.

