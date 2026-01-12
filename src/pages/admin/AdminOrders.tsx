import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAllOrders, useUpdateOrderStatus, useApproveCancellation, useRejectCancellation } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { History, CheckCircle, XCircle, User, Loader2, Ban } from 'lucide-react';
import type { OrderStatus, OrderWithProfile } from '@/types/database';

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useAllOrders();
  const updateOrderStatus = useUpdateOrderStatus();
  const approveCancellation = useApproveCancellation();
  const rejectCancellation = useRejectCancellation();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Approval dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithProfile | null>(null);
  const [approveQuantity, setApproveQuantity] = useState(1);

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

  const openApprovalDialog = (order: OrderWithProfile) => {
    setSelectedOrder(order);
    setApproveQuantity(order.quantity);
    setApprovalDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    
    setProcessingId(selectedOrder.id);
    try {
      await updateOrderStatus.mutateAsync({ 
        orderId: selectedOrder.id, 
        status: 'approved',
        approvedQuantity: approveQuantity
      });
      setApprovalDialogOpen(false);
      setSelectedOrder(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await updateOrderStatus.mutateAsync({ orderId, status: 'rejected' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveCancellation = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await approveCancellation.mutateAsync(orderId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectCancellation = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await rejectCancellation.mutateAsync(orderId);
    } finally {
      setProcessingId(null);
    }
  };

  const statusCounts = {
    all: orders?.length || 0,
    pending: orders?.filter((o) => o.status === 'pending').length || 0,
    approved: orders?.filter((o) => o.status === 'approved').length || 0,
    rejected: orders?.filter((o) => o.status === 'rejected').length || 0,
    cancellation_requested: orders?.filter((o) => o.status === 'cancellation_requested').length || 0,
  };

  const formatMealType = (type: string) => type.replace('_', ' ');

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

        {/* Status Filter - Mobile Dropdown */}
        <div className="sm:hidden">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
              <SelectItem value="cancellation_requested">Cancel Requests ({statusCounts.cancellation_requested})</SelectItem>
              <SelectItem value="approved">Approved ({statusCounts.approved})</SelectItem>
              <SelectItem value="rejected">Rejected ({statusCounts.rejected})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter Tabs - Desktop */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)} className="hidden sm:block">
          <TabsList>
            <TabsTrigger value="all">
              All ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="cancellation_requested">
              Cancel Requests ({statusCounts.cancellation_requested})
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
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Menu Item</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Meal</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
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
                            {formatMealType(order.menus.meal_type)}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {order.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(order.menus.price || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-primary">
                            ₹{((order.menus.price || 0) * order.quantity).toFixed(2)}
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
                                    onClick={() => openApprovalDialog(order)}
                                    disabled={processingId === order.id}
                                    title="Approve order"
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
                                    onClick={() => handleReject(order.id)}
                                    disabled={processingId === order.id}
                                    title="Reject order"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {order.status === 'cancellation_requested' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleApproveCancellation(order.id)}
                                    disabled={processingId === order.id}
                                    title="Approve cancellation"
                                  >
                                    {processingId === order.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Ban className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRejectCancellation(order.id)}
                                    disabled={processingId === order.id}
                                    title="Reject cancellation"
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

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{order.profiles?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.profiles?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium">{order.menus.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {formatMealType(order.menus.meal_type)} • {format(parseISO(order.menus.menu_date), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Qty:</span>
                          <p className="font-medium">{order.quantity}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <p>₹{(order.menus.price || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <p className="font-medium text-primary">₹{((order.menus.price || 0) * order.quantity).toFixed(2)}</p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Ordered: {format(parseISO(order.created_at), 'MMM d, h:mm a')}
                      </p>

                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => openApprovalDialog(order)}
                            disabled={processingId === order.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleReject(order.id)}
                            disabled={processingId === order.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {order.status === 'cancellation_requested' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveCancellation(order.id)}
                            disabled={processingId === order.id}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Approve Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleRejectCancellation(order.id)}
                            disabled={processingId === order.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
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

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Order</DialogTitle>
            <DialogDescription>
              Specify how many items to approve for this order.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Student:</span>
                  <p className="font-medium">{selectedOrder.profiles?.name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Menu:</span>
                  <p className="font-medium">{selectedOrder.menus.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Requested:</span>
                  <p className="font-medium">{selectedOrder.quantity} item(s)</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit Price:</span>
                  <p className="font-medium">₹{(selectedOrder.menus.price || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approveQty">Approve Quantity</Label>
                <Input
                  id="approveQty"
                  type="number"
                  min={1}
                  max={selectedOrder.quantity}
                  value={approveQuantity}
                  onChange={(e) => setApproveQuantity(
                    Math.min(selectedOrder.quantity, Math.max(1, parseInt(e.target.value) || 1))
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  You can approve up to {selectedOrder.quantity} item(s)
                </p>
              </div>

              <div className="p-3 rounded-md bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium">Bill Amount</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{((selectedOrder.menus.price || 0) * approveQuantity).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {approveQuantity} × ₹{(selectedOrder.menus.price || 0).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={processingId !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve {approveQuantity} Item(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
