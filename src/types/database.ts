// Application types derived from database schema

export type AppRole = 'admin' | 'student';
export type MealType = 'breakfast' | 'lunch' | 'evening_snack' | 'dinner';
export type OrderStatus = 'pending' | 'approved' | 'rejected';
export type MenuStatus = 'open' | 'closed';

export interface Profile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Menu {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  menu_date: string;
  meal_type: MealType;
  order_deadline: string;
  total_quantity: number;
  remaining_quantity: number;
  price: number;
  status: MenuStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  menu_id: string;
  quantity: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderWithMenu extends Order {
  menus: Menu;
}

export interface OrderWithProfile extends Order {
  profiles: Profile | null;
  menus: Menu;
}

export interface Bill {
  id: string;
  order_id: string;
  user_id: string;
  menu_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  bill_date: string;
  created_at: string;
}

export interface BillWithDetails extends Bill {
  menus: Menu;
}
