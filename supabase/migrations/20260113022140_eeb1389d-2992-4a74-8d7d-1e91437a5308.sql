-- Add token and fulfillment columns to orders table
ALTER TABLE public.orders 
ADD COLUMN token TEXT UNIQUE,
ADD COLUMN is_fulfilled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN fulfilled_at TIMESTAMP WITH TIME ZONE;

-- Create function to generate unique token on order approval
CREATE OR REPLACE FUNCTION public.generate_order_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate token only when status changes to 'approved' and token is null
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.token IS NULL THEN
    NEW.token := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text || RANDOM()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for token generation
CREATE TRIGGER generate_order_token_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_token();

-- Update RLS policy to allow admins to update is_fulfilled
DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
CREATE POLICY "Admins can update any order" 
ON public.orders 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));