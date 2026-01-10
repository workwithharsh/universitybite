import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BillWithDetails } from '@/types/database';

export function useMyBills() {
  return useQuery({
    queryKey: ['my-bills'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          menus (*)
        `)
        .eq('user_id', user.id)
        .order('bill_date', { ascending: false });

      if (error) throw error;
      return data as BillWithDetails[];
    },
  });
}

export function useAllBills() {
  return useQuery({
    queryKey: ['all-bills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          menus (*)
        `)
        .order('bill_date', { ascending: false });

      if (error) throw error;
      return data as BillWithDetails[];
    },
  });
}
