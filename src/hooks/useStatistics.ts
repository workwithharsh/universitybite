import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OrderStats {
  date: string;
  total_orders: number;
  approved_orders: number;
  rejected_orders: number;
  pending_orders: number;
}

interface MealStats {
  meal_type: string;
  total_orders: number;
}

export function useOrderStatistics() {
  return useQuery({
    queryKey: ['order-statistics'],
    queryFn: async () => {
      // Get orders with menu data
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          status,
          quantity,
          created_at,
          menus!inner (
            menu_date,
            meal_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data for statistics
      const ordersByDate = new Map<string, OrderStats>();
      const ordersByMeal = new Map<string, number>();

      orders?.forEach((order: any) => {
        const date = order.menus.menu_date;
        const mealType = order.menus.meal_type;

        // By date
        if (!ordersByDate.has(date)) {
          ordersByDate.set(date, {
            date,
            total_orders: 0,
            approved_orders: 0,
            rejected_orders: 0,
            pending_orders: 0,
          });
        }
        const dateStats = ordersByDate.get(date)!;
        dateStats.total_orders += order.quantity;
        if (order.status === 'approved') dateStats.approved_orders += order.quantity;
        if (order.status === 'rejected') dateStats.rejected_orders += order.quantity;
        if (order.status === 'pending') dateStats.pending_orders += order.quantity;

        // By meal
        ordersByMeal.set(mealType, (ordersByMeal.get(mealType) || 0) + order.quantity);
      });

      const dateStats = Array.from(ordersByDate.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7); // Last 7 days

      const mealStats: MealStats[] = Array.from(ordersByMeal.entries()).map(
        ([meal_type, total_orders]) => ({ meal_type, total_orders })
      );

      return {
        dateStats,
        mealStats,
        totalOrders: orders?.length || 0,
        pendingCount: orders?.filter((o) => o.status === 'pending').length || 0,
      };
    },
  });
}
