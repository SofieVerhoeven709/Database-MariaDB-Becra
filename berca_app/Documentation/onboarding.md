# Developer Onboarding

## Requirements

- Node.js 20+
- pnpm
- Docker Desktop
- GitHub Desktop
- Railway account access
- WebStorm or VS Code

---

## Clone Repository

```bash
git clone <repository-url>
cd <project-folder>
```

---

## Install Dependencies

```bash
pnpm install
```

---

## Environment Variables

Create a `.env` file based on `.env.example`.

Example:

```env
DATABASE_URL=
PRIVATE_KEY=
PUBLIC_KEY=
```

---

## Railway Login

```bash
railway login
railway link
```

---

## Start Development

```bash
pnpm dev
```