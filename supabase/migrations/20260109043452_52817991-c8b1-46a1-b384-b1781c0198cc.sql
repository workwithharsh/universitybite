-- Add price column to menus table
ALTER TABLE public.menus
ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00;