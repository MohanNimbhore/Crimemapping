# 🛡️ Crime Hotspot Mapping & Predictive Analytics Platform

> **AI-Powered Crime Intelligence, Hotspot Detection, Spatial Risk Analytics & Patrol Route Optimization Platform** (Focused on Gujarat & Pan-India Regions).

---

## 📑 Table of Contents
1. [Problem Statement & Project Objective](#-problem-statement--project-objective)
2. [Key Features & Capabilities](#-key-features--capabilities)
3. [Technology Stack](#-technology-stack)
4. [Complete Project Structure](#-complete-project-structure)
5. [System Architecture & Data Flow](#-system-architecture--data-flow)
6. [API Endpoints Reference](#-api-endpoints-reference)
7. [Database Schema & Data Models](#-database-schema--data-models)
8. [Step-by-Step Installation & Setup Guide](#-step-by-step-installation--setup-guide)
9. [How to Run the Application](#-how-to-run-the-application)
10. [Demo Login & Testing Credentials](#-demo-login--testing-credentials)
11. [Security Best Practices & Hardening](#-security-best-practices--hardening)
12. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🎯 Problem Statement & Project Objective

### ❗ Problem Statement
Modern law enforcement agencies face severe challenges with traditional, reactive policing models:
- **Scattered Data:** Crime records are siloed in paper FIRs or disjointed digital tables without geospatial intelligence.
- **Reactive vs. Proactive:** Police respond *after* crimes occur rather than anticipating and deterring high-risk incidents.
- **Suboptimal Patrol Resource Allocation:** Patrol beats and police van routes are planned manually, leading to delayed response times and unmonitored blind spots.
- **Lack of Predictive Insights:** Spatial density and temporal crime patterns (e.g., night-time vehicle thefts in specific neighborhoods) are not analyzed with Machine Learning.

### 💡 Project Objective
To build an end-to-end, full-stack **Law Enforcement Intelligence System** that provides:
1. **Interactive Spatial Crime Mapping:** Visualizing incidents with live clusters, risk levels, and filters across Indian cities (Ahmedabad, Surat, Vadodara, Mumbai, Delhi, etc.).
2. **AI-Powered Crime Hotspot Detection:** Utilizing **K-Means Clustering** and density estimation to identify critical crime zones.
3. **Multi-Factor Risk Prediction:** Computing temporal, density, and severity-weighted risk scores using Machine Learning algorithms.
4. **Patrol Route Optimization:** Calculating optimal police patrol beats from stations using the **Nearest-Neighbor Traveling Salesman Algorithm**.
5. **Real-time Incident Alerts & Trend Dashboards:** Live notification feeds and analytical charts to enable rapid law enforcement decision-making.
6. **Dual-Mode Execution:** Works in **Online Mode** (connected to Cloud PostgreSQL/Supabase) and in **Resilient Offline/Demo Mode** without crashing.

---

## ✨ Key Features & Capabilities

| Feature | Description |
| :--- | :--- |
| **Command Center (Dashboard)** | Real-time overview of total crimes, active hotspots, unread alerts, sparkline metrics, interactive map preview, and crime trend charts. |
| **Crime Intelligence Map (`/map`)** | Fullscreen GIS map built with **OpenLayers**; features city/state filtering (Gujarat / All India), incident clustering, hotspot radii, and popup incident details. |
| **Crime Records Management (`/crimes`)** | Full CRUD operations for crime incidents with severity levels (`critical`, `high`, `medium`, `low`), status badges, search, and date filters. |
| **Hotspot Analysis (`/hotspots`)** | Unsupervised spatial clustering (**K-Means**) to identify zones requiring elevated surveillance. |
| **AI Risk Predictions (`/predictions`)** | Custom coordinate risk evaluation + automated batch predictive scoring based on temporal weights and incident density. |
| **Patrol Route Optimization (`/routes`)** | Generates turn-by-turn waypoint routes from designated police stations through high-risk hotspots to minimize travel distance and response latency. |
| **Real-time Alerts (`/alerts`)** | Priority alert management for emergency threats, drug activity, and theft spikes with single-click acknowledgment. |
| **Deep Analytics (`/analytics`)** | Time-series crime trends, crime type breakdown, city-wise incident comparison, and severity distribution charts. |
| **User & Officer Management (`/users`)** | Role-Based Access Control (**Admin** vs. **Officer**) with audit timestamps. |
| **Theme System** | Instant, zero-lag Dark Mode and high-contrast Light Mode. |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 (TypeScript, Strict Mode)
- **Bundler & Build Tool:** Vite 5
- **Styling:** Vanilla CSS + Tailwind CSS v3 (Custom design tokens, glassmorphism, contrast-tuned light & dark themes)
- **GIS & Mapping Engine:** OpenLayers (`ol` v10) with OpenStreetMap / CartoDB raster tile sources
- **Data Visualization & Charts:** Recharts (`AreaChart`, `PieChart`, `BarChart`, `CartesianGrid`, `Tooltip`)
- **Iconography:** Lucide React
- **Routing:** React Router v6 (`BrowserRouter`, `Routes`, `Route`, `Navigate`)
- **Database Client:** Supabase JS SDK (`@supabase/supabase-js` v2)

### Backend (Machine Learning & AI Service)
- **Runtime:** Python 3.12+
- **Framework:** Flask 3.0 + Flask-CORS
- **Machine Learning & Analytics:** `scikit-learn` (Random Forest, K-Means, StandardScaler), `pandas`, `numpy`, `joblib`
- **WSGI / Web Server:** Werkzeug (Development) / Gunicorn (Production)

### Database & Security
- **Database:** PostgreSQL (Cloud Supabase) + Local In-Memory/LocalStorage Hybrid Store
- **Security:** Row Level Security (RLS) policies, JWT-based Authentication, Bcrypt Password Hashing, Trigger-based Profile Synchronization

---

## 📂 Complete Project Structure

```
Crimemapping/
├── .bolt/                             # Configuration files
├── backend/
│   ├── ml_service/                    # Python Flask ML Service
│   │   ├── .venv/                     # Python Virtual Environment
│   │   ├── app.py                     # Flask API (K-Means, Random Forest, Predict, Train)
│   │   └── requirements.txt           # Python dependency specifications
│   │
│   ├── server/                        # TypeScript backend controllers & config
│   │   ├── config/
│   │   │   ├── constants.ts           # Shared constants (Crime Types, Cities, Coordinates)
│   │   │   └── supabase.ts            # Server-side Supabase client config
│   │   └── controllers/
│   │       ├── alertController.ts     # Alert logic
│   │       ├── analyticsController.ts # Trend calculations
│   │       ├── crimeController.ts     # Crime record handlers
│   │       ├── hotspotController.ts   # Hotspot data
│   │       ├── predictionController.ts# Prediction endpoints
│   │       ├── routeController.ts     # Route calculation
│   │       └── userController.ts      # User management
│   │
│   └── supabase/                      # Database migrations
│       └── migrations/
│           ├── 20260715182853_005_security_fix_rls_and_password_column.sql
│           ├── 20260819074929_006_auto_create_user_profile_trigger.sql
│           ├── 20260819080421_007_fix_infinite_recursion_rls.sql
│           └── 20260819080434_008_revoke_execute_on_security_definer_functions.sql
│
├── src/                               # Frontend Application Source Code
│   ├── components/
│   │   ├── Dashboard/                 # Dashboard widgets
│   │   │   ├── BottomPanels.tsx       # Trends, Pie distribution, Top Hotspots, Risk bars
│   │   │   ├── DashboardMap.tsx       # Embedded dashboard OpenLayers map preview
│   │   │   ├── MapFilters.tsx         # Type/Severity/City quick filter controls
│   │   │   ├── RecentAlerts.tsx       # Live alert list feed
│   │   │   └── SparklineCard.tsx      # Metric cards with animated sparklines
│   │   ├── Layout/
│   │   │   ├── Header.tsx             # Navbar with Search, Date, Theme switch, User avatar
│   │   │   ├── Layout.tsx             # Main page container + Sidebar wrapper
│   │   │   └── Sidebar.tsx            # Navigation beat menu & Quick actions
│   │   └── ui/
│   │       └── LoadingSpinner.tsx     # Animated loading components
│   │
│   ├── contexts/                      # React State Contexts
│   │   ├── AuthContext.tsx            # Session management, Login/Signup, Role tracking
│   │   ├── SidebarContext.tsx         # Sidebar collapse & mobile drawer state
│   │   └── ThemeContext.tsx           # Dark/Light mode switcher
│   │
│   ├── lib/                           # Core utilities & API bridges
│   │   ├── api.ts                     # Unified API interface (Supabase + MockStore fallback)
│   │   ├── hooks.ts                   # Custom hooks (ScrollReveal, CountUp, Debounce)
│   │   ├── mockStore.ts               # Offline state store with 250+ realistic India records
│   │   ├── seedData.ts                # Database seeder (Gujarat & Metro cities)
│   │   ├── supabase.ts                # Safe Supabase client initialization
│   │   └── utils.ts                   # Formatting helpers (dates, distance, duration, colors)
│   │
│   ├── pages/                         # Application Views
│   │   ├── Alerts.tsx                 # Alert feed and acknowledge view
│   │   ├── Analytics.tsx              # Deep analytics charts & statistics
│   │   ├── CrimeMap.tsx               # Fullscreen GIS Crime Intelligence Map
│   │   ├── CrimeRecords.tsx           # Crime records table + Add Incident Modal
│   │   ├── Dashboard.tsx              # Main command center
│   │   ├── Hotspots.tsx               # K-Means Hotspot detector & table
│   │   ├── Login.tsx                  # Sign in / Sign up view with Quick Demo button
│   │   ├── PatrolRoutes.tsx           # Nearest-neighbor patrol beat generator
│   │   ├── Predictions.tsx            # AI prediction runner & custom lat/lng scorer
│   │   ├── SeedData.tsx               # Database seeding utility page
│   │   ├── Settings.tsx               # Platform configuration & preferences
│   │   └── Users.tsx                  # Officer & admin management
│   │
│   ├── types/
│   │   └── index.ts                   # Global TypeScript definitions & interfaces
│   │
│   ├── App.tsx                        # Main Router & Route Guards (`PrivateRoute`)
│   ├── index.css                      # Master Design System (CSS variables & animations)
│   └── main.tsx                       # React DOM root entrypoint
│
├── index.html                         # HTML entry
├── package.json                       # Frontend Node.js dependencies & scripts
├── tailwind.config.js                 # Tailwind styling rules
├── tsconfig.json                      # TypeScript compiler settings
├── vite.config.ts                     # Vite build configuration
└── README.md                          # Complete Project Documentation
```

---

## 🔄 System Architecture & Data Flow

```
                                  ┌────────────────────────────────────────┐
                                  │           User / Web Browser           │
                                  │      (React 18 + Vite + Tailwind)      │
                                  └───────────────────┬────────────────────┘
                                                      │
                                                      ▼
                                       ┌──────────────────────────────┐
                                       │   Unified API Bridge         │
                                       │       (src/lib/api.ts)       │
                                       └──────┬────────────────┬──────┘
                                              │                │
                    ┌─────────────────────────┘                └────────────────────────┐
                    │ (If Supabase Configured)                                          │ (If Offline / Demo Mode)
                    ▼                                                                   ▼
       ┌────────────────────────┐                                          ┌────────────────────────┐
       │   Supabase Cloud DB    │                                          │    Local Mock Store    │
       │ (PostgreSQL + Auth SDK)│                                          │ (localStorage/Memory)  │
       └────────────┬───────────┘                                          └───────────┬────────────┘
                    │                                                                  │
                    │                                                                  │
                    └─────────────────────────┐        ┌───────────────────────────────┘
                                              ▼        ▼
                                       ┌──────────────────────────────┐
                                       │   Python ML Service          │
                                       │ (Flask @ http://localhost:5000)│
                                       ├──────────────────────────────┤
                                       │ • K-Means Spatial Hotspots   │
                                       │ • Random Forest Risk Scorer  │
                                       │ • Temporal Density Matrix    │
                                       └──────────────────────────────┘
```

### Data Flow Explanation:
1. **User Action:** The user logs in or interacts with filters on the Command Center or GIS Map.
2. **API Request Routing (`src/lib/api.ts`):** 
   - When `.env` contains valid Supabase keys, queries execute against PostgreSQL via Supabase SDK.
   - If keys are missing or network is offline, queries route to `mockStore.ts` seamlessly without crashing.
3. **ML Prediction Engine:** When the user clicks **"Detect Hotspots"** or **"Generate Predictions"**, the client executes local algorithmic spatial clustering and connects to the Flask Python ML backend (`/detect-hotspots`, `/predict`).
4. **Interactive GIS Rendering:** Coordinate data is transformed via OpenLayers (`EPSG:4326` to `EPSG:3857`) and rendered with vector layers, dynamic clustering, and SVG popups.

---

## 🌐 API Endpoints Reference

### 🐍 Python Flask ML Service (`http://127.0.0.1:5000`)

| Endpoint | Method | Payload / Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | None | Returns service health status and model load state. |
| `/predict` | `POST` | `{ "latitude": float, "longitude": float, "crimes": Crime[] }` | Computes density, temporal weights, and risk score (0–100) for a coordinate. |
| `/detect-hotspots` | `POST` | `{ "crimes": Crime[], "k": int }` | Runs **K-Means clustering** on crime coordinates and returns hotspot centroids, radius, and risk levels. |
| `/batch-predict` | `POST` | `{ "crimes": Crime[], "threshold": int }` | Evaluates multi-location dataset and outputs prioritized high-risk predictions. |
| `/train` | `POST` | `{ "crimes": Crime[] }` | Fits the `RandomForestClassifier` with dynamic features extracted from records. |

### 🗄️ Supabase REST / SDK Operations

| Resource / Table | Method | Description |
| :--- | :--- | :--- |
| `crimes` | `SELECT / INSERT / UPDATE / DELETE` | Incident records with latitude, longitude, crime type, severity, status, and timestamps. |
| `hotspots` | `SELECT / INSERT / DELETE` | Spatial clusters with radius, crime counts, risk level, and dominant crime types. |
| `predictions` | `SELECT / INSERT / DELETE` | Predictive risk records with confidence ratings and contributing factors. |
| `patrol_routes` | `SELECT / INSERT / DELETE` | Saved patrol beat routes with station origin, waypoints, distance, and duration. |
| `alerts` | `SELECT / INSERT / UPDATE (is_read)` | High-priority notifications with acknowledgement timestamps. |
| `users` | `SELECT / DELETE` | System user profiles linked to Supabase Auth UUIDs. |

---

## 🗃️ Database Schema & Data Models

### 1. `crimes`
```sql
CREATE TABLE public.crimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crime_type VARCHAR(100) NOT NULL,
    crime_date DATE NOT NULL,
    crime_time TIME NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    area_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. `hotspots`
```sql
CREATE TABLE public.hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius INTEGER NOT NULL DEFAULT 1000,
    crime_count INTEGER NOT NULL,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    area_name VARCHAR(150) NOT NULL,
    crime_types JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. `predictions`
```sql
CREATE TABLE public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_name VARCHAR(150) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    risk_score NUMERIC(5,2) NOT NULL,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    prediction_date DATE NOT NULL,
    confidence_score NUMERIC(3,2),
    factors JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. `patrol_routes`
```sql
CREATE TABLE public.patrol_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    station_latitude DOUBLE PRECISION NOT NULL,
    station_longitude DOUBLE PRECISION NOT NULL,
    station_name VARCHAR(150) NOT NULL,
    hotspots JSONB NOT NULL DEFAULT '[]'::jsonb,
    waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_distance NUMERIC(6,2),
    estimated_duration INTEGER,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'completed')) DEFAULT 'active',
    assigned_officer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. `alerts`
```sql
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(100) NOT NULL,
    area_name VARCHAR(150) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    risk_score NUMERIC(5,2),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 6. `users`
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'officer')) DEFAULT 'officer',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## ⚙️ Step-by-Step Installation & Setup Guide

### 📋 Prerequisites
Ensure the following are installed on your machine:
- **Node.js:** v18.0.0 or later (Recommended: v20 LTS or v22)
- **Python:** v3.10, v3.11, or v3.12
- **Git:** Latest version

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/MohanNimbhore/Crimemapping.git
cd Crimemapping
```

---

### 2️⃣ Frontend Setup
Install frontend npm packages:
```bash
npm install
```

---

### 3️⃣ Python ML Backend Setup
Navigate to the ML service directory and create a virtual environment:

#### On Windows (PowerShell):
```powershell
cd backend\ml_service
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..\..
```

#### On Linux / macOS:
```bash
cd backend/ml_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

---

### 4️⃣ Optional: Configure Cloud Supabase Database (If using Online Mode)
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*(Note: If you leave `.env` empty or do not configure Supabase, the application automatically launches in **Offline / Demo Mode** with pre-seeded datasets).*

---

## 🚀 How to Run the Application

### 🔹 Step 1: Start the Python ML Service
In your first terminal:

#### On Windows (PowerShell):
```powershell
cd backend\ml_service
.\.venv\Scripts\python.exe app.py
```

#### On Linux / macOS:
```bash
cd backend/ml_service
source .venv/bin/activate
python app.py
```
*(The ML service will start at `http://127.0.0.1:5000`)*

---

### 🔹 Step 2: Start the Frontend Vite Development Server
In your second terminal (from the project root):
```bash
npm run dev
```
*(The Frontend application will launch at `http://localhost:5173/`)*

---

### 🔹 Step 3: Open in Browser
Open your browser and navigate to:
👉 **[http://localhost:5173/](http://localhost:5173/)**

---

## 🔑 Demo Login & Testing Credentials

On the login page, you can sign in instantly using any of the following methods:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin Officer** | `admin@crimemapper.com` | `admin123` | Full Access (Dashboard, Map, Hotspots, Predictions, Routes, Alerts, Users, Settings) |
| **Field Officer** | `officer@police.gov.in` | `officer123` | Operational Access (Crimes, Map, Hotspots, Patrol Routes, Alerts) |

> ⚡ **Quick Access Feature:** You can also simply click the blue **"Quick Demo Access (Click to Login)"** box on the login screen to sign in automatically with one click.

---

## 🔒 Security Best Practices & Hardening

1. **Row Level Security (RLS):**
   - All PostgreSQL tables in Supabase have `ENABLE ROW LEVEL SECURITY` turned ON.
   - Officers can only view and update authorized crime beats and route logs.
   - Only `admin` role holders can delete records or manage officer credentials.

2. **Automated User Profile Synchronization:**
   - PostgreSQL trigger `handle_new_user` creates internal user profiles securely upon Supabase Auth signup without requiring elevated client-side permissions.

3. **No Service Role Keys in Client Bundle:**
   - Client code only references `VITE_SUPABASE_ANON_KEY`. Administrative DB overrides and service role keys are strictly contained on the server.

4. **Input Sanitization & Boundary Validation:**
   - Latitude and longitude values are strictly validated within valid Indian geographical bounding boxes (Lat: 6.0 to 37.0, Lng: 68.0 to 97.5).
   - SQL queries use parameterized Supabase ORM builders to prevent SQL Injection.

5. **CORS & ML API Protection:**
   - Flask CORS configuration prevents unauthorized origins from hijacking ML prediction models.
   - For production deployment, set `CORS(app, origins=["https://your-domain.com"])`.

---

## ❓ Troubleshooting & FAQs

### Q1: The map on `/map` is not displaying tiles or is blank.
**Solution:** Ensure you are running the latest code where the map container is always present in the DOM. Check that your network connection allows loading OpenStreetMap tiles (`https://tile.openstreetmap.org`).

### Q2: What if I don't have a Supabase account or database credentials?
**Solution:** No configuration is required. The platform comes with an in-memory/localStorage mock store pre-seeded with 250+ realistic crime incidents, hotspots, alerts, and routes across Ahmedabad, Surat, Vadodara, Mumbai, and Delhi.

### Q3: How to run the production build?
```bash
npm run build
npm run preview
```

### Q4: How do I change the default focus city?
Use the **City Filter dropdown** on the top header of the **Command Center** or **Crime Intelligence Map** (`/map`). Selecting a city (e.g., *Surat* or *Mumbai*) will automatically animate and fly the camera directly to that city's coordinates.

---

## 👨‍💻 Maintainer & Contributors
- **Repository:** [GitHub - MohanNimbhore/Crimemapping](https://github.com/MohanNimbhore/Crimemapping)
- **License:** MIT License
