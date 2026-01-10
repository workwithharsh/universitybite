-- Add evening_snack to meal_type enum
ALTER TYPE public.meal_type ADD VALUE IF NOT EXISTS 'evening_snack';

-- Create bills table to store generated bills when orders are approved
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  bill_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bills table
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- RLS: Students can view their own bills
CREATE POLICY "Students can view their own bills"
ON public.bills
FOR SELECT
USING (user_id = auth.uid());

-- RLS: Admins can view all bills
CREATE POLICY "Admins can view all bills"
ON public.bills
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Admins can insert bills (when approving orders)
CREATE POLICY "Admins can insert bills"
ON public.bills
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to automatically generate bill when order is approved
CREATE OR REPLACE FUNCTION public.generate_bill_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate bill when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.bills (order_id, user_id, menu_id, quantity, unit_price, total_amount)
    SELECT 
      NEW.id,
      NEW.user_id,
      NEW.menu_id,
      NEW.quantity,
      m.price,
      NEW.quantity * m.price
    FROM public.menus m
    WHERE m.id = NEW.menu_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-generating bills
CREATE TRIGGER trigger_generate_bill_on_approval
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_bill_on_approval();

-- Update existing sample menus with prices
UPDATE public.menus SET price = 
  CASE 
    WHEN meal_type = 'breakfast' THEN 5.00
    WHEN meal_type = 'lunch' THEN 8.00
    WHEN meal_type = 'dinner' THEN 10.00
    ELSE 6.00
  END
WHERE price = 0;