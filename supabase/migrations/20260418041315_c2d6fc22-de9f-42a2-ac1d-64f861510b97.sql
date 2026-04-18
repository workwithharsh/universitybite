-- ============================================================
-- 1. user_roles: prevent privilege escalation
-- ============================================================
-- Only admins can insert role assignments (the handle_new_user trigger
-- runs as SECURITY DEFINER so it bypasses RLS and still works for signup).
CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update role assignments
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete role assignments
CREATE POLICY "Only admins can remove roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 2. bills: scope policies to authenticated users only
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert bills" ON public.bills;
DROP POLICY IF EXISTS "Admins can view all bills" ON public.bills;
DROP POLICY IF EXISTS "Students can view their own bills" ON public.bills;

CREATE POLICY "Admins can insert bills"
ON public.bills
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all bills"
ON public.bills
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own bills"
ON public.bills
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- 3. orders: scope policies to authenticated users only
-- ============================================================
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
DROP POLICY IF EXISTS "Students can update their orders for cancellation" ON public.orders;

CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any order"
ON public.orders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can update their orders for cancellation"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND (status = 'pending'::order_status OR status = 'approved'::order_status)
)
WITH CHECK (
  user_id = auth.uid()
  AND status = 'cancellation_requested'::order_status
);