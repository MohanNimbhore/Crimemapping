# Crime Hotspot Mapping & Predictive Patrol Routing System

A comprehensive, production-ready full-stack web application for law enforcement agencies to identify crime hotspots, predict future crime-prone areas using AI/ML, and generate optimized patrol routes.

## Features

### Dashboard
- Real-time crime statistics and analytics
- Active alerts overview
- Crime distribution by type and severity
- Monthly trend visualization
- High-risk area monitoring

### Crime Data Management
- Complete CRUD operations for crime records
- Advanced filtering (by type, severity, city, date range)
- Full-text search functionality
- Pagination support
- Detailed crime information with location coordinates

### Interactive Crime Map
- Full-screen Leaflet map with dark theme
- Crime markers with popup details
- Hotspot visualization with risk-level coloring
- City filtering and layer controls
- OpenStreetMap integration

### Hotspot Detection (K-Means Clustering)
- AI-powered crime cluster detection
- Configurable number of clusters
- Risk level assessment per hotspot
- Crime type distribution analysis
- Visual representation on map

### AI Crime Prediction (Random Forest)
- Machine learning-based risk prediction
- Location-specific risk assessment
- Multi-factor analysis (time, location, crime type, severity)
- Confidence scoring
- Custom location prediction

### Patrol Route Optimization (A* Pathfinding)
- Automatic route generation from police stations
- Priority-based hotspot ordering
- Distance and duration estimation
- Route visualization
- Officer assignment support

### Emergency Alert System
- Automatic alert generation for high-risk areas
- Severity-based categorization
- Read/unread status tracking
- Bulk operations (mark all read, clear all)

### Analytics Dashboard
- Trend analysis with interactive charts
- Crime type distribution
- Weekly and hourly patterns
- Comparative analysis

### User Management
- Role-based access control (Admin/Officer)
- User CRUD operations
- Secure authentication

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS (Dark theme)
- Leaflet / React-Leaflet for maps
- Recharts for data visualization
- Lucide React for icons

### Backend/Database
- Supabase (PostgreSQL with RLS)
- Row Level Security for data protection
- Real-time subscriptions ready

### ML Service
- Python Flask
- Scikit-learn (K-Means, Random Forest)
- NumPy / Pandas

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+ (for ML service)
- Supabase account (or use provided instance)

### Installation

1. Clone the repository

2. Install frontend dependencies:
```bash
npm install
```

3. Install ML service dependencies:
```bash
cd ml_service
pip install -r requirements.txt
```

4. Set up environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

6. (Optional) Start the ML service:
```bash
cd ml_service
python app.py
```

### Database Seeding

Navigate to `/seed` route after logging in to populate the database with sample data (500 crime records, 25 alerts).

### Demo Credentials

- Admin: `admin@pdm.com` / `admin123`
- Officer: `john.smith@pdm.com` / `officer123`

## Project Structure

```
project/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   └── ui/
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       └── LoadingSpinner.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── supabase.ts
│   │   ├── hooks.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── CrimeRecords.tsx
│   │   ├── CrimeMap.tsx
│   │   ├── Hotspots.tsx
│   │   ├── Predictions.tsx
│   │   ├── PatrolRoutes.tsx
│   │   ├── Alerts.tsx
│   │   ├── Analytics.tsx
│   │   ├── Users.tsx
│   │   ├── Settings.tsx
│   │   ├── Login.tsx
│   │   └── SeedData.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── config/
│   ├── controllers/
│   └── routes/
├── ml_service/
│   ├── app.py
│   └── requirements.txt
├── database/
│   └── migrations/
└── package.json
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Crimes
- `GET /crimes` - List all crimes (with filters)
- `GET /crimes/:id` - Get single crime
- `POST /crimes` - Create crime
- `PUT /crimes/:id` - Update crime
- `DELETE /crimes/:id` - Delete crime

### Hotspots
- `GET /hotspots` - List all hotspots
- `POST /detect-hotspots` - Run clustering algorithm

### Predictions
- `GET /predictions` - List predictions
- `POST /predict` - Predict risk for location
- `POST /batch-predict` - Generate batch predictions

### Patrol Routes
- `GET /routes` - List all routes
- `POST /routes` - Create route
- `PUT /routes/:id` - Update route
- `DELETE /routes/:id` - Delete route

### Alerts
- `GET /alerts` - List alerts
- `POST /alerts` - Create alert
- `PUT /alerts/:id/read` - Mark as read
- `DELETE /alerts/:id` - Delete alert

### Users (Admin only)
- `GET /users` - List all users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## ML Service Endpoints

- `GET /health` - Health check
- `POST /predict` - Predict risk for single location
- `POST /detect-hotspots` - K-Means clustering
- `POST /train` - Train prediction model
- `POST /batch-predict` - Generate multiple predictions

## Database Schema

### Tables
- `users` - User accounts with role-based access
- `crimes` - Crime records with location and details
- `predictions` - AI-generated risk predictions
- `hotspots` - Detected crime clusters
- `patrol_routes` - Optimized patrol routing data
- `alerts` - Emergency alert notifications
- `activity_logs` - System activity tracking

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control (Admin/Officer)
- Secure password storage
- Authenticated API routes

## Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Render)
- Connect GitHub repository
- Set build command: `npm run build`
- Set start command: `npm run preview`

### ML Service (Render/Heroku)
```bash
cd ml_service
pip install -r requirements.txt
python app.py
```

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions welcome! Please read contributing guidelines first.
