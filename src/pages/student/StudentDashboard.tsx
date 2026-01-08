import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { MenuCard } from '@/components/MenuCard';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMenus } from '@/hooks/useMenus';
import { useCreateOrder, useMyOrders } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarIcon, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MealType } from '@/types/database';

export default function StudentDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const queryClient = useQueryClient();

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: menus, isLoading: menusLoading } = useMenus(dateString, selectedMeal);
  const { data: myOrders } = useMyOrders();
  const createOrder = useCreateOrder();

  // Real-time subscription for menu updates
  useEffect(() => {
    const channel = supabase
      .channel('menu-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menus' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['menus'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const getExistingOrder = (menuId: string) => {
    return myOrders?.find((order) => order.menu_id === menuId);
  };

  const handleOrder = async (menuId: string, quantity: number) => {
    await createOrder.mutateAsync({ menuId, quantity });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Food Menu</h1>
          <p className="text-muted-foreground">
            Browse and order your meals for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Date Picker & Meal Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full sm:w-auto justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Tabs 
            value={selectedMeal} 
            onValueChange={(v) => setSelectedMeal(v as MealType)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
              <TabsTrigger value="lunch">Lunch</TabsTrigger>
              <TabsTrigger value="dinner">Dinner</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Menu Grid */}
        {menusLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="aspect-video" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : menus && menus.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                existingOrder={getExistingOrder(menu.id)}
                onOrder={(qty) => handleOrder(menu.id, qty)}
                isOrdering={createOrder.isPending}
              />
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="mb-2">No Menus Available</CardTitle>
              <CardDescription>
                There are no {selectedMeal} menus for {format(selectedDate, 'MMMM d, yyyy')}.
                <br />
                Try selecting a different date or meal type.
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
