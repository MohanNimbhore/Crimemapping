-- Add auth_user_id column to link with Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Drop old policies that required 'authenticated' role (which isn't set without Supabase Auth session)
DROP POLICY IF EXISTS "select_users_authenticated" ON users;
DROP POLICY IF EXISTS "insert_users_authenticated" ON users;
DROP POLICY IF EXISTS "update_users_authenticated" ON users;
DROP POLICY IF EXISTS "delete_users_authenticated" ON users;

DROP POLICY IF EXISTS "select_crimes_authenticated" ON crimes;
DROP POLICY IF EXISTS "insert_crimes_authenticated" ON crimes;
DROP POLICY IF EXISTS "update_crimes_authenticated" ON crimes;
DROP POLICY IF EXISTS "delete_crimes_authenticated" ON crimes;

DROP POLICY IF EXISTS "select_predictions_authenticated" ON predictions;
DROP POLICY IF EXISTS "insert_predictions_authenticated" ON predictions;
DROP POLICY IF EXISTS "update_predictions_authenticated" ON predictions;
DROP POLICY IF EXISTS "delete_predictions_authenticated" ON predictions;

DROP POLICY IF EXISTS "select_hotspots_authenticated" ON hotspots;
DROP POLICY IF EXISTS "insert_hotspots_authenticated" ON hotspots;
DROP POLICY IF EXISTS "update_hotspots_authenticated" ON hotspots;
DROP POLICY IF EXISTS "delete_hotspots_authenticated" ON hotspots;

DROP POLICY IF EXISTS "select_routes_authenticated" ON patrol_routes;
DROP POLICY IF EXISTS "insert_routes_authenticated" ON patrol_routes;
DROP POLICY IF EXISTS "update_routes_authenticated" ON patrol_routes;
DROP POLICY IF EXISTS "delete_routes_authenticated" ON patrol_routes;

DROP POLICY IF EXISTS "select_alerts_authenticated" ON alerts;
DROP POLICY IF EXISTS "insert_alerts_authenticated" ON alerts;
DROP POLICY IF EXISTS "update_alerts_authenticated" ON alerts;
DROP POLICY IF EXISTS "delete_alerts_authenticated" ON alerts;

DROP POLICY IF EXISTS "select_logs_authenticated" ON activity_logs;
DROP POLICY IF EXISTS "insert_logs_authenticated" ON activity_logs;

-- Users: allow anon to select own profile by auth.uid() and allow insert on signup
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "users_delete" ON users FOR DELETE TO authenticated USING (auth.uid() = auth_user_id);

-- Allow service_role to bypass for seeding
CREATE POLICY "users_admin_all" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Crimes: any authenticated user can CRUD
CREATE POLICY "crimes_select" ON crimes FOR SELECT TO authenticated USING (true);
CREATE POLICY "crimes_insert" ON crimes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crimes_update" ON crimes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "crimes_delete" ON crimes FOR DELETE TO authenticated USING (true);
CREATE POLICY "crimes_admin" ON crimes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Predictions
CREATE POLICY "predictions_select" ON predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "predictions_insert" ON predictions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "predictions_update" ON predictions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "predictions_delete" ON predictions FOR DELETE TO authenticated USING (true);
CREATE POLICY "predictions_admin" ON predictions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Hotspots
CREATE POLICY "hotspots_select" ON hotspots FOR SELECT TO authenticated USING (true);
CREATE POLICY "hotspots_insert" ON hotspots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "hotspots_update" ON hotspots FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hotspots_delete" ON hotspots FOR DELETE TO authenticated USING (true);
CREATE POLICY "hotspots_admin" ON hotspots FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Patrol routes
CREATE POLICY "routes_select" ON patrol_routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "routes_insert" ON patrol_routes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "routes_update" ON patrol_routes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "routes_delete" ON patrol_routes FOR DELETE TO authenticated USING (true);
CREATE POLICY "routes_admin" ON patrol_routes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Alerts
CREATE POLICY "alerts_select" ON alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "alerts_insert" ON alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "alerts_update" ON alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "alerts_delete" ON alerts FOR DELETE TO authenticated USING (true);
CREATE POLICY "alerts_admin" ON alerts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Activity logs
CREATE POLICY "logs_select" ON activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "logs_insert" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "logs_admin" ON activity_logs FOR ALL TO service_role USING (true) WITH CHECK (true);