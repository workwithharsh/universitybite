import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMyOrders, useCancelOrder } from '@/hooks/useOrders';
import { History, Trash2, ShoppingBag } from 'lucide-react';
import type { OrderWithMenu } from '@/types/database';

export default function StudentOrders() {
  const { data: orders, isLoading } = useMyOrders();
  const cancelOrder = useCancelOrder();
  const [orderToCancel, setOrderToCancel] = useState<OrderWithMenu | null>(null);

  const handleCancelOrder = async () => {
    if (orderToCancel) {
      await cancelOrder.mutateAsync(orderToCancel.id);
      setOrderToCancel(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">
            View and manage your food order history
          </p>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Order History</CardTitle>
            </div>
            <CardDescription>
              {orders?.length || 0} total orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Menu Item</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {order.menus.image_url ? (
                              <img
                                src={order.menus.image_url}
                                alt={order.menus.title}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            {order.menus.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(order.menus.menu_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="capitalize">
                          {order.menus.meal_type}
                        </TableCell>
                        <TableCell className="text-center">
                          {order.quantity}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(order.created_at), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>
                          {order.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setOrderToCancel(order)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No Orders Yet</h3>
                <p className="text-sm text-muted-foreground">
                  You haven't placed any orders yet. Browse the menu to get started!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Order Dialog */}
      <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your order for{' '}
              <strong>{orderToCancel?.menus.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
