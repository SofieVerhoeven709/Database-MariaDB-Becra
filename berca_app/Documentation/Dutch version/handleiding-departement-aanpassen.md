# Handleiding: departement aanpassen (extra knop + kleur)

> Taal: **NL** | [EN](./handleiding-departement-aanpassen-en.md)

In deze app zijn **departementen** vooral UI-tegels (cards) die linken naar een departement-pagina.
Daar zie je opnieuw tegels met “acties” binnen dat departement.

Deze handleiding behandelt twee vaak voorkomende vragen:

1. **Een extra knop/tegel toevoegen** onder een departement (bv. nieuwe actie in het departement)
2. **De kleur van een departement veranderen**

---

## Snel overzicht (waar zit wat?)

### Departementen overzicht (tegels)
- Component: `src/components/custom/departmentGrid.tsx`
- Data komt van: `src/app/api/departments/route.ts` (Prisma → tabel `Department`)

### Departement detail (acties/tegels binnen een departement)
- Pagina: `src/app/(app)/departments/[departmentId]/page.tsx`
- Actie-tegels: `src/components/custom/departmentActionGrid.tsx`
- Config (welke acties bestaan er): `src/extra/departmentActions.ts`

---

## 1) Extra knop/tegel toevoegen onder een departement

In deze codebase is “een extra knop onder een departement” meestal één van deze twee dingen:

- **A. Nieuwe actie-tegel op de departementpagina** (meest voorkomend)
- **B. Een extra knop op de departement-tegel in het overzicht** (op dashboard)

### A) Nieuwe actie-tegel op de departementpagina (aanbevolen)

Op de departementpagina (`/departments/<id>`) worden de actie-tegels opgebouwd uit `DEPARTMENT_ACTIONS`.

#### Stap 1 — Voeg de actie toe in `DEPARTMENT_ACTIONS`
Bestand: `src/extra/departmentActions.ts`

Zoek het object:

- `export const DEPARTMENT_ACTIONS: Record<string, DepartmentAction[]> = { ... }`

En voeg een extra item toe in het juiste blok.

Belangrijk:
- De key is de **department name** uit de database/seed (bv. `HR`, `Engineering`, `General`, …)
- `id` wordt onderdeel van de URL: `/departments/<departmentId>/<id>`

Voorbeeld (conceptueel):
- Voeg toe onder `HR: [ ... ]` of onder `General: [ ... ]`
- Kies een unieke `id` zoals `trainingPlan`

Velden:
- `id`: uniek, liefst **camelCase** (in de repo zie je dat vaak terug)
- `name`: label op de tegel
- `description`: korte uitleg onder de titel
- `icon`: naam van een icoon (komt uit `src/extra/icons.ts`)
- `owner`: vrije string (wordt nu vooral gebruikt als metadata)

#### Stap 2 — Maak de pagina voor de nieuwe actie-route

De tegel linkt naar:

- `/departments/${department.id}/${action.id}`

Dus je hebt ook een pagina nodig op:

- `src/app/(app)/departments/[departmentId]/<action.id>/page.tsx`

Je kan starten met een placeholder zoals bestaande routes (bv. `admin`, `strategy`).
Zoek voorbeelden in:
- `src/app/(app)/departments/[departmentId]/admin/page.tsx`
- `src/app/(app)/departments/[departmentId]/strategy/page.tsx`

#### Stap 3 (optioneel) — Breadcrumb label toevoegen

In de navbar/breadcrumbs worden bekende segmenten “mooi” vertaald.
Als je wil dat je nieuwe segment een nette naam krijgt, voeg je hem toe in:

- `src/components/custom/dashboardNavbar.tsx` → `SEGMENT_LABELS`

Voorbeeld:
- `trainingPlan: 'Training plan'`

#### Stap 4 — Testen

- Open `/departments/<een-departement-id>`
- Check of de nieuwe actie-tegel verschijnt
- Klik en controleer of de nieuwe route werkt

---

### B) Extra knop op de departement-tegel in het overzicht (dashboard)

De departement-tegels in het overzicht zijn in `src/components/custom/departmentGrid.tsx` opgebouwd als één grote `<Link>`-card.

Als je daar “onder” de tegel nog een knop wil zetten, let dan op:

- **Je mag geen `<button>` of tweede `<a>` binnen een `<Link>` nesten** (HTML/Next.js problemen)

Praktische oplossingen:

1. **Maak van de card een `<div>`**, en plaats binnenin:
   - een `<Link>` voor de titel/hoofdactie
   - daarnaast/onderaan een `<Button>` of extra `<Link>` voor de extra actie

2. Hou het consistent: als het “een actie binnen het departement” is, is oplossing **A** meestal netter.

---

## 2) Departementkleur veranderen

Departement-kleur is in deze app vooral **data-gedreven**: elk departement heeft een `color` (hex) in de database.
De UI gebruikt die kleur als accent (icoon-kleur en achtergrondtint).

### Waar wordt de kleur gebruikt?

- `src/components/custom/departmentGrid.tsx`
- `src/components/custom/departmentActionGrid.tsx`

Daar wordt `dept.color` / `department.color` omgezet naar:
- `--dept-accent` (de echte kleur)
- `--dept-bg` en `--dept-bg-hover` (zelfde kleur met transparantie)

### Optie 1 — Kleur aanpassen in de seed (dev)

Als je lokaal met seeding werkt, pas dan de kleur aan in:
- `prisma/seedDev.ts` → `ALL_DEPARTMENTS`

Voorbeeld:
- `color: '#00b0f0'`

Let op:
- Gebruik bij voorkeur **#RRGGBB** (7 tekens)
- Geen korte hex `#FFF` (die werkt niet met de transparantie-truc `#RRGGBBAA`)

Daarna seed je opnieuw (hoe exact hangt af van jullie workflow; vaak iets als `pnpm prisma db seed`).

### Optie 2 — Kleur aanpassen in de database

In Prisma is dit veld:
- model `Department` → `color String?`

Dus als je een admin-tool of een SQL update gebruikt, volstaat het om `Department.color` te updaten.

### Optie 3 — Styling aanpassen (hoe kleur “voelt” in de UI)

Wil je dat de kleur subtieler/sterker wordt, dan pas je de alpha’s aan in:
- `departmentGrid.tsx` en/of `departmentActionGrid.tsx`

Daar zie je iets zoals:
- `${accentColor}1F` (lichte achtergrond)
- `${accentColor}2E` (hover)

Hogere alpha = sterker zichtbaar.

---

## 3) Handige zoektermen

- `<DepartmentGrid` / `DepartmentGrid(`
- `DepartmentActionGrid`
- `DEPARTMENT_ACTIONS`
- `href="/departments/"`
- `SEGMENT_LABELS`

---

## 4) Snelle test-commands

Vanuit de projectroot (`berca_app`):

```powershell
pnpm dev
```

Optioneel:

```powershell
pnpm lint
pnpm build
```

