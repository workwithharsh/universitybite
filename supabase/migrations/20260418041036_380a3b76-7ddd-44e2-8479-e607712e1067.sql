-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone authenticated can view open menus" ON public.menus;

-- Students: only see open menus for today or future dates
CREATE POLICY "Students can view available menus"
ON public.menus
FOR SELECT
TO authenticated
USING (
  status = 'open'::menu_status
  AND menu_date >= CURRENT_DATE
  AND has_role(auth.uid(), 'student'::app_role)
);

-- Admins: see all menus
CREATE POLICY "Admins can view all menus"
ON public.menus
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));