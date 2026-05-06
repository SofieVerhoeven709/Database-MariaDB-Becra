# Handleiding: knop (Button) aanpassen

> Taal: **NL** | [EN](../../../../OneDrive/Desktop/Becra/docs/handleiding-button-aanpassen-en.md)

Deze codebase gebruikt een centrale `Button` component (Shadcn UI-stijl) met **varianten** en **sizes** via *class-variance-authority (CVA)*.

## Checklist (snel overzicht)

- [ ] Vind waar de knop is gedefinieerd (`src/components/ui/button.tsx`).
- [ ] Bepaal of je iets **globaal** (alle knoppen) of **lokaal** (één plek) wil aanpassen.
- [ ] Pas óf de **basis styles** óf een **variant/size** aan.
- [ ] Test in de UI met `pnpm dev`.
- [ ] (Optioneel) Voeg een nieuwe `variant` toe en vervang losse `className` overrides.

---

## 1) Waar staat de Button?

Bestand:

- `src/components/ui/button.tsx`

Belangrijke onderdelen:

- `buttonVariants`: hierin staan de Tailwind classes (basis + varianten + sizes)
- `Button`: de React component zelf
- `asChild`: maakt het mogelijk om bv. een `<a>` of `<Link>` te stylen als knop

De component zet ook nuttige attributes:

- `data-slot="button"`
- `data-variant={variant}`
- `data-size={size}`

Dat is handig als je later *CSS selectors* wil gebruiken (maar meestal is CVA genoeg).

---

## 2) Globaal vs lokaal aanpassen (keuzehulp)

### A. Ik wil één specifieke knop anders maken
Gebruik `className` bij die knop.

Voorbeeld:

```tsx
<Button className="bg-red-600 hover:bg-red-700">Verwijderen</Button>
```

Gebruik dit vooral voor *eenmalige* uitzonderingen.

### B. Ik wil alle knoppen (of een hele categorie) consistent aanpassen
Pas `buttonVariants` aan in `src/components/ui/button.tsx` of voeg een nieuwe `variant` toe.

---

## 3) Basis-styling aanpassen (geldt voor alle varianten)

In `button.tsx` staat bovenaan een grote basis class-string, bv.:

- layout: `inline-flex items-center justify-center gap-2`
- typography: `text-sm font-medium`
- rounding: `rounded-md`
- accessibility/focus: `focus-visible:ring-[3px] ...`
- disabled: `disabled:opacity-50`

Wanneer je dingen als **border-radius**, **focus ring**, **disabled gedrag** of **icon spacing** wil veranderen, doe je dat hier.

Tip: wijzig kleuren liever via de thema-tokens (zie stap 6) zodat alles (ook tabs, badges, etc.) consistent blijft.

---

## 4) Bestaande varianten aanpassen

In `buttonVariants` → `variants.variant` staan de varianten:

- `default`
- `destructive`
- `outline`
- `secondary`
- `ghost`
- `link`

Voorbeeld: als je de `default` knop groener wil maken, wijzig je de classes in `default:`.

Gebruik in code:

```tsx
<Button variant="default">Opslaan</Button>
<Button variant="outline">Annuleren</Button>
<Button variant="destructive">Verwijderen</Button>
```

---

## 5) Sizes aanpassen of toevoegen

In `buttonVariants` → `variants.size` staan de maten:

- `default`, `xs`, `sm`, `lg`
- `icon`, `icon-xs`, `icon-sm`, `icon-lg`

Gebruik in code:

```tsx
<Button size="xs">Klein</Button>
<Button size="lg">Groot</Button>
<Button size="icon" aria-label="Zoeken">
  <Search />
</Button>
```

Als je een extra maat wil (bv. `xl`), voeg je die toe in `variants.size` en (optioneel) maak je ’m de standaard via `defaultVariants`.

---

## 6) Een nieuwe variant toevoegen (aanbevolen)

Waarom? In plaats van overal losse `className`-overrides te zetten, hou je styling centraal en consistent.

### Stappen

1. Open `src/components/ui/button.tsx`
2. Voeg een key toe onder `variants.variant`, bv. `success`:

```ts
variant: {
  // ...
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
}
```

3. Gebruik daarna:

```tsx
<Button variant="success">Goedkeuren</Button>
```

### Wanneer toch thema-tokens gebruiken?

Als je wil dat de variant automatisch meedoet met `dark` / `high-contrast`, dan is het vaak netter om met CSS-variabelen te werken in `src/app/globals.css` (bijv. een extra `--success` + `--success-foreground`).

---

## 7) Thema-kleuren (primary/accent/destructive) aanpassen

De Button-varianten gebruiken kleur-tokens zoals:

- `bg-primary`, `text-primary-foreground`
- `bg-accent`, `text-accent-foreground`
- `bg-destructive`

Die tokens komen uit `src/app/globals.css` (CSS variabelen zoals `--primary`, `--accent`, ...).

Als je dus wil dat **alle** `primary` knoppen een andere kleur krijgen, is dit vaak de beste plek.

---

## 8) Buttons terugvinden in de code

Handige zoektermen:

- `from "@/components/ui/button"`
- `<Button`
- `variant="` / `size="`

Doel: kijk of er plekken zijn waar veel `className`-workarounds staan die je kunt vervangen door één nette variant.

---

## 9) Link als knop (asChild)

Als je een knop wil die eigenlijk een link is, is `asChild` vaak de mooiste optie:

```tsx
import Link from "next/link"

<Button asChild>
  <Link href="/projects">Naar projecten</Link>
</Button>
```

Dan blijft de styling van `Button`, maar de markup wordt semantisch een link.

---

## 10) Testen (snel)

Vanuit de projectroot (`berca_app`):

```powershell
pnpm dev
```

Optioneel:

```powershell
pnpm lint
pnpm format
```

---

## Troubleshooting

### Tailwind wijzigingen lijken niet door te komen

Check `tailwind.config.ts`. In deze repo staat alle code in `src/`.

Als de `content`-paden niet naar `./src/**` wijzen, kan het zijn dat Tailwind classes niet (goed) gegenereerd worden.

### ClassName werkt niet zoals verwacht

`cn()` (in `src/lib/utils.ts`) gebruikt `tailwind-merge`: dat **dedupliceert** conflicterende Tailwind classes.

Voorbeeld: als `buttonVariants` al `h-9` zet en jij zet `h-10`, dan blijft meestal alleen de laatste/sterkste over. Dat is meestal gewenst, maar het verklaart soms “waarom mijn class verdwijnt”.

