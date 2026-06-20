-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'officer' CHECK (role IN ('admin', 'officer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crimes table
CREATE TABLE crimes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crime_type TEXT NOT NULL,
  crime_date DATE NOT NULL,
  crime_time TIME NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  area_name TEXT NOT NULL,
  city TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  risk_score DECIMAL(5, 2) NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  prediction_date DATE NOT NULL,
  confidence_score DECIMAL(5, 2),
  factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hotspots table
CREATE TABLE hotspots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER NOT NULL DEFAULT 500,
  crime_count INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  area_name TEXT NOT NULL,
  crime_types JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patrol routes table
CREATE TABLE patrol_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  station_latitude DECIMAL(10, 8) NOT NULL,
  station_longitude DECIMAL(11, 8) NOT NULL,
  station_name TEXT NOT NULL,
  hotspots JSONB NOT NULL,
  waypoints JSONB NOT NULL,
  total_distance DECIMAL(10, 2),
  estimated_duration INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  assigned_officer_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type TEXT NOT NULL,
  area_name TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  risk_score DECIMAL(5, 2),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_crimes_location ON crimes(latitude, longitude);
CREATE INDEX idx_crimes_date ON crimes(crime_date);
CREATE INDEX idx_crimes_type ON crimes(crime_type);
CREATE INDEX idx_crimes_severity ON crimes(severity);
CREATE INDEX idx_predictions_area ON predictions(area_name);
CREATE INDEX idx_alerts_created ON alerts(created_at);
CREATE INDEX idx_alerts_type ON alerts(alert_type);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "select_users_authenticated" ON users FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_users_authenticated" ON users FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_users_authenticated" ON users FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_users_authenticated" ON users FOR DELETE
  TO authenticated USING (true);

-- Crimes policies
CREATE POLICY "select_crimes_authenticated" ON crimes FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_crimes_authenticated" ON crimes FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_crimes_authenticated" ON crimes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_crimes_authenticated" ON crimes FOR DELETE
  TO authenticated USING (true);

-- Predictions policies
CREATE POLICY "select_predictions_authenticated" ON predictions FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_predictions_authenticated" ON predictions FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_predictions_authenticated" ON predictions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_predictions_authenticated" ON predictions FOR DELETE
  TO authenticated USING (true);

-- Hotspots policies
CREATE POLICY "select_hotspots_authenticated" ON hotspots FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_hotspots_authenticated" ON hotspots FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_hotspots_authenticated" ON hotspots FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_hotspots_authenticated" ON hotspots FOR DELETE
  TO authenticated USING (true);

-- Patrol routes policies
CREATE POLICY "select_routes_authenticated" ON patrol_routes FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_routes_authenticated" ON patrol_routes FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_routes_authenticated" ON patrol_routes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_routes_authenticated" ON patrol_routes FOR DELETE
  TO authenticated USING (true);

-- Alerts policies
CREATE POLICY "select_alerts_authenticated" ON alerts FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_alerts_authenticated" ON alerts FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_alerts_authenticated" ON alerts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_alerts_authenticated" ON alerts FOR DELETE
  TO authenticated USING (true);

-- Activity logs policies
CREATE POLICY "select_logs_authenticated" ON activity_logs FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_logs_authenticated" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (true);