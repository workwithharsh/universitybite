-- Drop the existing policy and create a new one that allows students to request cancellation on their pending or approved orders
DROP POLICY IF EXISTS "Students can update their pending orders" ON public.orders;

CREATE POLICY "Students can update their orders for cancellation"
ON public.orders
FOR UPDATE
USING (
  user_id = auth.uid() AND 
  (status = 'pending'::order_status OR status = 'approved'::order_status)
)
WITH CHECK (
  user_id = auth.uid() AND 
  (status = 'cancellation_requested'::order_status)
);

-- Also update the admin delete policy to allow deleting cancellation_requested orders
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));