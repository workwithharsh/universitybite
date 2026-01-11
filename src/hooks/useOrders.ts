import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Order, OrderWithMenu, OrderWithProfile, OrderStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useMyOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          menus (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrderWithMenu[];
    },
    enabled: !!user,
  });
}

export function useAllOrders(menuId?: string) {
  return useQuery({
    queryKey: ['all-orders', menuId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          menus (*)
        `)
        .order('created_at', { ascending: false });

      if (menuId) {
        query = query.eq('menu_id', menuId);
      }

      const { data: orders, error } = await query;
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(orders?.map(o => o.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return orders?.map(order => ({
        ...order,
        profiles: profileMap.get(order.user_id) || null,
      })) as OrderWithProfile[];
    },
  });
}

export function useUserOrderForMenu(menuId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-order', menuId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('menu_id', menuId)
        .maybeSingle();

      if (error) throw error;
      return data as Order | null;
    },
    enabled: !!user && !!menuId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ menuId, quantity }: { menuId: string; quantity: number }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          menu_id: menuId,
          quantity,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-order', variables.menuId] });
      toast({
        title: 'Order placed',
        description: 'Your order has been submitted for approval.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to place order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      approvedQuantity 
    }: { 
      orderId: string; 
      status: OrderStatus;
      approvedQuantity?: number;
    }) => {
      const updateData: { status: OrderStatus; quantity?: number } = { status };
      
      // If approving with a specific quantity, update the quantity too
      if (status === 'approved' && approvedQuantity !== undefined) {
        updateData.quantity = approvedQuantity;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-bills'] });
      const message = variables.status === 'approved' && variables.approvedQuantity
        ? `Order approved for ${variables.approvedQuantity} item(s).`
        : `The order has been ${variables.status}.`;
      toast({
        title: `Order ${variables.status}`,
        description: message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRequestCancellation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancellation_requested' as OrderStatus })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      toast({
        title: 'Cancellation requested',
        description: 'Your cancellation request has been submitted for admin approval.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to request cancellation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useApproveCancellation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-order'] });
      toast({
        title: 'Cancellation approved',
        description: 'The order has been cancelled.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to approve cancellation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRejectCancellation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // Revert status back to the previous state (e.g., pending or approved)
      // For simplicity, we'll set it back to pending
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'pending' as OrderStatus })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      toast({
        title: 'Cancellation rejected',
        description: 'The cancellation request has been rejected.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to reject cancellation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
