# Spotter — FMCSA HOS Trip Planner

Plan truck trips under US Hours of Service rules. Get route maps, step-by-step instructions, and FMCSA-style daily driver log sheets.

**Live app**

| Service | URL |
|---------|-----|
| Frontend | https://spotter-hos.vercel.app |
| API | https://spotter-api.onrender.com/api/health/ |

## Stack

- **Backend:** Django 5 + DRF (`backend/`)
- **Frontend:** React 19 + TypeScript + Vite (`frontend/`)
- **Routing / geocoding:** OSRM, Photon (via API)

## Local development

```bash
# API
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && python manage.py runserver

# UI
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

## Deploy

- **API:** [Render](https://render.com) — `render.yaml` (service `spotter-api`)
- **UI:** [Vercel](https://vercel.com) — root directory `frontend`, env `VITE_API_URL=https://spotter-api.onrender.com/api`

## Tests

```bash
cd backend && source .venv/bin/activate && python manage.py test trips.tests
cd frontend && npm run build
```

## Disclaimer

Assessment / education project — not a certified Electronic Logging Device (ELD).
