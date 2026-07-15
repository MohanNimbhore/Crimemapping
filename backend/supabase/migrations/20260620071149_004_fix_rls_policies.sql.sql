-- Drop all existing weak RLS policies and recreate with proper restrictions

-- ============================================
-- CRIMES TABLE
-- ============================================
DROP POLICY IF EXISTS "crimes_insert" ON crimes;
DROP POLICY IF EXISTS "crimes_update" ON crimes;
DROP POLICY IF EXISTS "crimes_delete" ON crimes;
DROP POLICY IF EXISTS "insert_crimes_authenticated" ON crimes;
DROP POLICY IF EXISTS "update_crimes_authenticated" ON crimes;
DROP POLICY IF EXISTS "delete_crimes_authenticated" ON crimes;

CREATE POLICY "crimes_insert" ON crimes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "crimes_update" ON crimes FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "crimes_delete" ON crimes FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- PREDICTIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "predictions_insert" ON predictions;
DROP POLICY IF EXISTS "predictions_update" ON predictions;
DROP POLICY IF EXISTS "predictions_delete" ON predictions;
DROP POLICY IF EXISTS "insert_predictions_authenticated" ON predictions;
DROP POLICY IF EXISTS "update_predictions_authenticated" ON predictions;
DROP POLICY IF EXISTS "delete_predictions_authenticated" ON predictions;

CREATE POLICY "predictions_insert" ON predictions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "predictions_update" ON predictions FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "predictions_delete" ON predictions FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- HOTSPOTS TABLE
-- ============================================
DROP POLICY IF EXISTS "hotspots_insert" ON hotspots;
DROP POLICY IF EXISTS "hotspots_update" ON hotspots;
DROP POLICY IF EXISTS "hotspots_delete" ON hotspots;
DROP POLICY IF EXISTS "insert_hotspots_authenticated" ON hotspots;
DROP POLICY IF EXISTS "update_hotspots_authenticated" ON hotspots;
DROP POLICY IF EXISTS "delete_hotspots_authenticated" ON hotspots;

CREATE POLICY "hotspots_insert" ON hotspots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "hotspots_update" ON hotspots FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "hotspots_delete" ON hotspots FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- PATROL_ROUTES TABLE
-- ============================================
DROP POLICY IF EXISTS "routes_insert" ON patrol_routes;
DROP POLICY IF EXISTS "routes_update" ON patrol_routes;
DROP POLICY IF EXISTS "routes_delete" ON patrol_routes;
DROP POLICY IF EXISTS "insert_routes_authenticated" ON patrol_routes;
DROP POLICY IF EXISTS "update_routes_authenticated" ON patrol_routes;
DROP POLICY IF EXISTS "delete_routes_authenticated" ON patrol_routes;

CREATE POLICY "routes_insert" ON patrol_routes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "routes_update" ON patrol_routes FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "routes_delete" ON patrol_routes FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- ALERTS TABLE
-- ============================================
DROP POLICY IF EXISTS "alerts_insert" ON alerts;
DROP POLICY IF EXISTS "alerts_update" ON alerts;
DROP POLICY IF EXISTS "alerts_delete" ON alerts;
DROP POLICY IF EXISTS "insert_alerts_authenticated" ON alerts;
DROP POLICY IF EXISTS "update_alerts_authenticated" ON alerts;
DROP POLICY IF EXISTS "delete_alerts_authenticated" ON alerts;

CREATE POLICY "alerts_insert" ON alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "alerts_update" ON alerts FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "alerts_delete" ON alerts FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- ============================================
-- ACTIVITY_LOGS TABLE
-- ============================================
DROP POLICY IF EXISTS "logs_insert" ON activity_logs;
DROP POLICY IF EXISTS "insert_logs_authenticated" ON activity_logs;

CREATE POLICY "logs_insert" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
