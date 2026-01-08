import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAllOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { History, CheckCircle, XCircle, User, Loader2 } from 'lucide-react';
import type { OrderStatus } from '@/types/database';

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useAllOrders();
  const updateOrderStatus = useUpdateOrderStatus();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Real-time subscription for order updates
  useEffect(() => {
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filteredOrders = orders?.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    setProcessingId(orderId);
    try {
      await updateOrderStatus.mutateAsync({ orderId, status });
    } finally {
      setProcessingId(null);
    }
  };

  const statusCounts = {
    all: orders?.length || 0,
    pending: orders?.filter((o) => o.status === 'pending').length || 0,
    approved: orders?.filter((o) => o.status === 'approved').length || 0,
    rejected: orders?.filter((o) => o.status === 'rejected').length || 0,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">
            Review and manage student food orders
          </p>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <TabsList>
            <TabsTrigger value="all">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({statusCounts.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({statusCounts.rejected})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Orders</CardTitle>
            </div>
            <CardDescription>
              {filteredOrders?.length || 0} orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Menu Item</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{order.profiles?.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.profiles?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.menus.title}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(order.menus.menu_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="capitalize">
                          {order.menus.meal_type}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {order.quantity}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(order.created_at), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {order.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleStatusUpdate(order.id, 'approved')}
                                  disabled={processingId === order.id}
                                >
                                  {processingId === order.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleStatusUpdate(order.id, 'rejected')}
                                  disabled={processingId === order.id}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No Orders Found</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter === 'all'
                    ? 'No orders have been placed yet.'
                    : `No ${statusFilter} orders.`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
