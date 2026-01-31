-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create meal type enum
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'approved', 'rejected');

-- Create menu status enum
CREATE TYPE public.menu_status AS ENUM ('open', 'closed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);

-- Create menus table
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  menu_date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  order_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  status menu_status NOT NULL DEFAULT 'open',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  menu_id UUID REFERENCES public.menus(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, menu_id) -- Prevent multiple orders per menu per user
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menus_updated_at
  BEFORE UPDATE ON public.menus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Default role is student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to auto-close menu when quantity reaches zero
CREATE OR REPLACE FUNCTION public.check_menu_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.remaining_quantity = 0 AND NEW.status = 'open' THEN
    NEW.status = 'closed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_menu_quantity_trigger
  BEFORE UPDATE ON public.menus
  FOR EACH ROW EXECUTE FUNCTION public.check_menu_quantity();

-- Trigger to update menu quantity on order approval
CREATE OR REPLACE FUNCTION public.update_menu_on_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When order is approved, decrease remaining quantity
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE public.menus
    SET remaining_quantity = remaining_quantity - NEW.quantity
    WHERE id = NEW.menu_id
      AND remaining_quantity >= NEW.quantity;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient quantity available';
    END IF;
  END IF;
  
  -- When approved order is rejected, restore quantity
  IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    UPDATE public.menus
    SET remaining_quantity = remaining_quantity + OLD.quantity
    WHERE id = NEW.menu_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_menu_on_order_status_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_menu_on_order_status();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for menus
CREATE POLICY "Anyone authenticated can view open menus"
  ON public.menus FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert menus"
  ON public.menus FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update menus"
  ON public.menus FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete menus"
  ON public.menus FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orders
CREATE POLICY "Students can view their own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can insert their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND public.has_role(auth.uid(), 'student')
  );

CREATE POLICY "Students can update their pending orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can update any order"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can delete their pending orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Enable realtime for menus and orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.menus;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true);

-- Storage policies for menu images
CREATE POLICY "Anyone can view menu images"
  ON storage.objects FOR SELECT   
  USING (bucket_id = 'menu-images');

CREATE POLICY "Admins can upload menu images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu-images' 
    AND public.has_role(auth.uid(), 'admin')
  );        

CREATE POLICY "Admins can update menu images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'menu-images' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete menu images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'menu-images' 
    AND public.has_role(auth.uid(), 'admin')
  );