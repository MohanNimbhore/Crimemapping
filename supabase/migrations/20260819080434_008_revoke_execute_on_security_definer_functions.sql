/*
# Revoke public execute on SECURITY DEFINER functions

## Problem
The security advisor flagged that `is_admin()` and `handle_new_user()` are
SECURITY DEFINER functions callable by anon and authenticated roles via the
REST API. These should only be called internally by triggers and RLS policies,
not directly by clients.

## Fix
Revoke EXECUTE from anon and authenticated on both functions. The trigger
on auth.users runs as the postgres owner, so it doesn't need role grants.
RLS policies call is_admin() internally, not via REST.

## Security
- Prevents direct RPC calls to these functions from the frontend.
- Functions remain usable by triggers and RLS policy evaluation.
*/

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
