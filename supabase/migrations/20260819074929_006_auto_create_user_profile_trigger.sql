/*
# Auto-create user profile on signup + fix orphaned users

## Problem
When a user signs up via Supabase Auth, their row in auth.users is created but
no corresponding row is inserted into the public.users table. The frontend's
signup function tries to insert the profile manually, but this fails silently
in several scenarios (e.g. the RLS check on INSERT requires auth.uid() = auth_user_id,
and the insert from the client sometimes fails due to policy timing). This leaves
authenticated users with no profile, so the app sees `user = null` and bounces
them back to the login page.

## Fix
1. Create a `handle_new_user` trigger function that automatically inserts a
   row into public.users whenever a new row is inserted into auth.users.
   The profile is populated from the user's email and raw_user_meta_data.name.
2. Attach the trigger to auth.users via `CREATE TRIGGER ... AFTER INSERT`.
3. Backfill orphaned auth users — those who have an auth.users row but no
   matching public.users row — so they can log in immediately.
4. Fix the users SELECT policy so admins can see all users (currently admins
   can only see their own row, but the Users page needs to list everyone).

## Security
- The trigger function is SECURITY DEFINER so it can insert into public.users
  regardless of the caller's role (the auth signup runs as anon).
- The trigger runs AFTER INSERT on auth.users, which is a privileged operation.
- The users_select policy is changed from "only own row" to "own row OR admin"
  so the admin Users page works.
*/

-- ── 1. Trigger function ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'officer'
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── 2. Trigger on auth.users ─────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. Backfill orphaned auth users ──────────────────────────
INSERT INTO public.users (auth_user_id, name, email, role)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  au.email,
  'officer'
FROM auth.users au
LEFT JOIN public.users u ON u.auth_user_id = au.id
WHERE u.id IS NULL
ON CONFLICT (auth_user_id) DO NOTHING;

-- ── 4. Fix users SELECT policy: own row OR admin can see all ─
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT
  TO authenticated USING (
    auth.uid() = auth_user_id
    OR EXISTS (
      SELECT 1 FROM public.users u2
      WHERE u2.auth_user_id = auth.uid() AND u2.role = 'admin'
    )
  );

-- ── 5. Fix users DELETE policy: admin can delete any user ────
DROP POLICY IF EXISTS "users_delete" ON public.users;
CREATE POLICY "users_delete" ON public.users FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users u3
      WHERE u3.auth_user_id = auth.uid() AND u3.role = 'admin'
    )
  );
