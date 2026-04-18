-- ============================================================
-- Realtime channel access: restrict to authenticated users.
-- postgres_changes already filters row events by table RLS, so
-- students will only receive their own order/bill rows. This adds
-- the missing channel-level gate that the security scanner flagged.
-- ============================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can send realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated users can read realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can send realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================
-- Defense-in-depth: prevent any user from inserting a role record
-- for their own user_id. Combined with the existing admin-only
-- INSERT policy, this blocks self-escalation even if the admin
-- check were ever weakened. The handle_new_user trigger runs as
-- SECURITY DEFINER and bypasses RLS, so signup still works.
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_self_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot assign roles to themselves';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER prevent_self_role_assignment_trigger
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_role_assignment();