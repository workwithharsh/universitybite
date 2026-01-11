-- Add 'cancellation_requested' to order_status enum
ALTER TYPE public.order_status ADD VALUE 'cancellation_requested';