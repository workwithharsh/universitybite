import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Menu, MealType, MenuStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useMenus(date?: string, mealType?: MealType) {
  return useQuery({
    queryKey: ['menus', date, mealType],
    queryFn: async () => {
      let query = supabase
        .from('menus')
        .select('*')
        .order('menu_date', { ascending: true })
        .order('meal_type', { ascending: true });

      if (date) {
        query = query.eq('menu_date', date);
      }

      if (mealType) {
        query = query.eq('meal_type', mealType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Menu[];
    },
  });
}

export function useMenu(id: string) {
  return useQuery({
    queryKey: ['menu', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Menu | null;
    },
    enabled: !!id,
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (menu: Omit<Menu, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('menus')
        .insert(menu)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast({
        title: 'Menu created',
        description: 'The menu item has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create menu',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Menu> & { id: string }) => {
      const { data, error } = await supabase
        .from('menus')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast({
        title: 'Menu updated',
        description: 'The menu item has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update menu',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast({
        title: 'Menu deleted',
        description: 'The menu item has been deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete menu',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
