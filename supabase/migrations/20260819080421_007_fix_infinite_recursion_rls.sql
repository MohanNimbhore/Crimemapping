/*
# Fix infinite recursion in users RLS policy

## Problem
The previous migration (006) added a users_select policy that checks if the
current user is an admin by running a subquery on the `users` table. But that
subquery is itself subject to the same RLS policy, which again checks for admin
by querying `users`... creating infinite recursion. The error is:
  "infinite recursion detected in policy for relation users" (code 42P17)

## Fix
1. Create a SECURITY DEFINER function `is_admin()` that checks the caller's
   role in the users table WITHOUT being subject to RLS (because SECURITY
   DEFINER functions run with the owner's privileges and bypass RLS by default
   when the owner is a superuser/table owner).
2. Replace the recursive users_select policy with one that uses `is_admin()`.
3. Replace the users_delete policy similarly.
4. Also fix all other tables (crimes, alerts, hotspots, predictions,
   patrol_routes, activity_logs) that have the same recursive pattern — they
   all check `EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = auth.uid()
   AND u.role = 'admin')` which also causes recursion on those tables.

## Security
- `is_admin()` is SECURITY DEFINER, owned by postgres, so it bypasses RLS.
  It only reads the role column and returns a boolean — no data leakage.
- All policies remain scoped to `authenticated` role.
*/

-- ── 1. Create is_admin() helper function ─────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
  );
$$;

-- ── 2. Fix users SELECT policy ───────────────────────────────
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT
  TO authenticated USING (
    auth.uid() = auth_user_id OR public.is_admin()
  );

-- ── 3. Fix users DELETE policy ───────────────────────────────
DROP POLICY IF EXISTS "users_delete" ON public.users;
CREATE POLICY "users_delete" ON public.users FOR DELETE
  TO authenticated USING (public.is_admin());

-- ── 4. Fix crimes policies (replace recursive subquery) ──────
DROP POLICY IF EXISTS "crimes_delete" ON public.crimes;
CREATE POLICY "crimes_delete" ON public.crimes FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "crimes_update" ON public.crimes;
CREATE POLICY "crimes_update" ON public.crimes FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 5. Fix alerts policies ────────────────────────────────────
DROP POLICY IF EXISTS "alerts_delete" ON public.alerts;
CREATE POLICY "alerts_delete" ON public.alerts FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "alerts_update" ON public.alerts;
CREATE POLICY "alerts_update" ON public.alerts FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 6. Fix hotspots policies ──────────────────────────────────
DROP POLICY IF EXISTS "hotspots_delete" ON public.hotspots;
CREATE POLICY "hotspots_delete" ON public.hotspots FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "hotspots_update" ON public.hotspots;
CREATE POLICY "hotspots_update" ON public.hotspots FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 7. Fix predictions policies ──────────────────────────────
DROP POLICY IF EXISTS "predictions_delete" ON public.predictions;
CREATE POLICY "predictions_delete" ON public.predictions FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "predictions_update" ON public.predictions;
CREATE POLICY "predictions_update" ON public.predictions FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 8. Fix patrol_routes policies ─────────────────────────────
DROP POLICY IF EXISTS "routes_delete" ON public.patrol_routes;
CREATE POLICY "routes_delete" ON public.patrol_routes FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "routes_update" ON public.patrol_routes;
CREATE POLICY "routes_update" ON public.patrol_routes FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 9. Fix activity_logs policies ─────────────────────────────
DROP POLICY IF EXISTS "logs_select" ON public.activity_logs;
CREATE POLICY "logs_select" ON public.activity_logs FOR SELECT
  TO authenticated USING (public.is_admin());
