import { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useMyBills } from '@/hooks/useBills';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Receipt, IndianRupee } from 'lucide-react';

export default function StudentBills() {
  const queryClient = useQueryClient();
  const { data: bills, isLoading } = useMyBills();

  // Real-time subscription for bill updates
  useEffect(() => {
    const channel = supabase
      .channel('bill-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bills' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-bills'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const totalAmount = bills?.reduce((sum, bill) => sum + Number(bill.total_amount), 0) || 0;

  const formatMealType = (type: string) => {
    return type.replace('_', ' ');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">My Bills</h1>
          <p className="text-muted-foreground">
            View your order bills and payment records
          </p>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Total Amount</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary flex items-center">
              <IndianRupee className="h-6 w-6" />
              {totalAmount.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              {bills?.length || 0} bill(s) total
            </p>
          </CardContent>
        </Card>

        {/* Bills Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Bill History</CardTitle>
            </div>
            <CardDescription>
              All your approved order bills
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : bills && bills.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill Date</TableHead>
                      <TableHead>Menu Item</TableHead>
                      <TableHead>Meal Type</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>
                          {format(parseISO(bill.bill_date), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {bill.menus.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {formatMealType(bill.menus.meal_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {bill.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{Number(bill.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          ₹{Number(bill.total_amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No Bills Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Bills will appear here when your orders are approved.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
