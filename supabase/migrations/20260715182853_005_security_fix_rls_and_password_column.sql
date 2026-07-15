/*
# Security Fix: RLS Policies & Password Column Removal

## Summary
Fixes critical security vulnerabilities in the database:
1. Removes the plaintext `password` column from the `users` table (Supabase Auth handles passwords).
2. Tightens the `users` SELECT policy so authenticated users can only read their own profile row — not every user's data.
3. Restricts DELETE and UPDATE on `crimes`, `hotspots`, `predictions`, `patrol_routes`, and `alerts` to admin users only (via a role check against the `users` table). Regular officers can still INSERT and SELECT.
4. Tightens `activity_logs` SELECT to admin-only.

## Security Changes
- **users table**: Drop `password` column. Replace `users_select` policy (`USING (true)`) with `USING (auth.uid() = auth_user_id)` so users can only read their own profile.
- **crimes/hotspots/predictions/patrol_routes/alerts**: DELETE and UPDATE policies now require the user to be an admin (role = 'admin' in the users table). The old policies only checked `auth.uid() IS NOT NULL`, which let any authenticated user modify or delete any record.
- **activity_logs**: SELECT now requires admin role.

## Important Notes
1. The `password` column is dropped with `DROP COLUMN` — this is safe because the column stores empty strings or legacy plaintext passwords that are no longer used (Supabase Auth manages authentication).
2. Admin-only checks use a subquery: `EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.role = 'admin')`.
3. All policies are made idempotent with `DROP POLICY IF EXISTS` before `CREATE POLICY`.
*/

-- ============================================================
-- 1. Drop the password column from users (no longer needed — Supabase Auth handles auth)
-- ============================================================
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- ============================================================
-- 2. Fix users SELECT policy — users can only read their OWN profile
-- ============================================================
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- ============================================================
-- 3. Fix users INSERT — only allow inserting own profile
-- ============================================================
DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- ============================================================
-- 4. Fix users UPDATE — only allow updating own profile
-- ============================================================
DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- ============================================================
-- 5. Fix users DELETE — only allow admin to delete users
-- ============================================================
DROP POLICY IF EXISTS "users_delete" ON users;
CREATE POLICY "users_delete"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

-- ============================================================
-- 6. Crimes: restrict DELETE and UPDATE to admins
-- ============================================================
DROP POLICY IF EXISTS "crimes_delete" ON crimes;
CREATE POLICY "crimes_delete"
ON crimes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

DROP POLICY IF EXISTS "crimes_update" ON crimes;
CREATE POLICY "crimes_update"
ON crimes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

-- ============================================================
-- 7. Hotspots: restrict DELETE and UPDATE to admins
-- ============================================================
DROP POLICY IF EXISTS "hotspots_delete" ON hotspots;
CREATE POLICY "hotspots_delete"
ON hotspots FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

DROP POLICY IF EXISTS "hotspots_update" ON hotspots;
CREATE POLICY "hotspots_update"
ON hotspots FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

-- ============================================================
-- 8. Predictions: restrict DELETE and UPDATE to admins
-- ============================================================
DROP POLICY IF EXISTS "predictions_delete" ON predictions;
CREATE POLICY "predictions_delete"
ON predictions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

DROP POLICY IF EXISTS "predictions_update" ON predictions;
CREATE POLICY "predictions_update"
ON predictions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

-- ============================================================
-- 9. Patrol Routes: restrict DELETE and UPDATE to admins
-- ============================================================
DROP POLICY IF EXISTS "routes_delete" ON patrol_routes;
CREATE POLICY "routes_delete"
ON patrol_routes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

DROP POLICY IF EXISTS "routes_update" ON patrol_routes;
CREATE POLICY "routes_update"
ON patrol_routes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

-- ============================================================
-- 10. Alerts: restrict DELETE and UPDATE to admins
-- ============================================================
DROP POLICY IF EXISTS "alerts_delete" ON alerts;
CREATE POLICY "alerts_delete"
ON alerts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

DROP POLICY IF EXISTS "alerts_update" ON alerts;
CREATE POLICY "alerts_update"
ON alerts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);

-- ============================================================
-- 11. Activity Logs: restrict SELECT to admins
-- ============================================================
DROP POLICY IF EXISTS "logs_select" ON activity_logs;
CREATE POLICY "logs_select"
ON activity_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  )
);
