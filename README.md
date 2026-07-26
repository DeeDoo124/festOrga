# Festorga

PWA mobile pour gérer un budget commun entre amis pendant un festival.

## Structure

- `frontend/` — React + Vite, PWA (mobile first)
- `backend/` — Node.js + Express, API + logique métier
- `001_init_schema.sql` — migration Supabase (tables `festorga_*`, RLS)

## Démarrage

Chaque dossier (`frontend/`, `backend/`) a son propre `package.json` et son `.env.example` à dupliquer en `.env`.

```
cd frontend && npm install && npm run dev
cd backend && npm install && npm run dev
```
