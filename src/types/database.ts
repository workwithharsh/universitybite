// Application types derived from database schema

export type AppRole = 'admin' | 'student';
export type MealType = 'breakfast' | 'lunch' | 'dinner';
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
  status: MenuStatus;
  price: number;
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
