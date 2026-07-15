# Crime Hotspot Mapping & Predictive Analytics Platform

A full-stack crime intelligence platform with interactive maps, AI predictions, patrol route optimization, and real-time alerts — focused on India (Gujarat by default).

## Project Structure

```
project/
├── frontend/          # React + Vite + TypeScript frontend
│   ├── src/           # React app source
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env           # Frontend env vars (VITE_SUPABASE_*)
│
├── backend/           # Backend services
│   ├── server/        # TypeScript server (controllers, config)
│   ├── ml_service/    # Python Flask ML service (predictions, hotspot detection)
│   └── supabase/      # Database migrations & SQL
│       └── migrations/
│
└── README.md
```

## Frontend

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS** for styling
- **React Leaflet** for interactive crime maps
- **Recharts** + **Chart.js** for analytics
- **Supabase JS SDK** for database & auth
- **Lucide React** for icons

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

### Build frontend

```bash
cd frontend
npm run build
```

## Backend

### TypeScript Server (`backend/server/`)

Contains controllers and config for API endpoints. Uses Supabase as the database layer.

### Python ML Service (`backend/ml_service/`)

Flask-based ML service providing:
- `/predict` — Risk prediction for a location
- `/detect-hotspots` — K-Means clustering for hotspot detection
- `/train` — Train the risk prediction model
- `/batch-predict` — Batch predictions for multiple locations
- `/health` — Health check

#### Run ML service

```bash
cd backend/ml_service
pip install -r requirements.txt
python app.py
```

The ML service runs on `http://localhost:5000`.

### Database (Supabase)

Migrations are in `backend/supabase/migrations/`. The app uses Supabase for:
- PostgreSQL database
- Authentication (email/password)
- Row Level Security (RLS) policies

## Environment Variables

### Frontend (`frontend/.env`)

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Backend

The backend uses `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for server-side access.

## Deployment

### Frontend

Deploy the `frontend/` folder to any static hosting platform:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

Build command: `npm run build`
Output directory: `dist`

### Backend

- **ML Service**: Deploy `backend/ml_service/` to any Python hosting (Render, Railway, AWS, etc.)
- **Database**: Supabase is managed — no deployment needed

## Features

- Interactive crime map (Gujarat default, All India option)
- Crime records management
- AI-powered crime predictions
- Hotspot detection (K-Means clustering)
- Patrol route optimization (nearest-neighbor algorithm)
- Real-time alerts
- Analytics dashboard with charts
- User authentication with password reset
