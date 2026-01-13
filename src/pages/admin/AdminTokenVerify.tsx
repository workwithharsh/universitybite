import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Home, Search, Ticket, User, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import type { OrderWithProfile } from '@/types/database';

interface TokenOrderResult extends OrderWithProfile {
  token: string;
  is_fulfilled: boolean;
  fulfilled_at: string | null;
}

export default function AdminTokenVerify() {
  const { toast } = useToast();
  const [tokenInput, setTokenInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [orderResult, setOrderResult] = useState<TokenOrderResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchToken = async () => {
    if (!tokenInput.trim()) return;

    setIsSearching(true);
    setOrderResult(null);
    setNotFound(false);

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          menus (*)
        `)
        .eq('token', tokenInput.trim().toUpperCase())
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;

      if (!order) {
        setNotFound(true);
        return;
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();

      setOrderResult({
        ...order,
        profiles: profile || null,
      } as TokenOrderResult);
    } catch (error) {
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchToken();
    }
  };

  const markAsFulfilled = async () => {
    if (!orderResult) return;

    setIsMarking(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          is_fulfilled: true,
          fulfilled_at: new Date().toISOString(),
        })
        .eq('id', orderResult.id);

      if (error) throw error;

      setOrderResult({
        ...orderResult,
        is_fulfilled: true,
        fulfilled_at: new Date().toISOString(),
      });

      toast({
        title: 'Order fulfilled!',
        description: 'The order has been marked as collected.',
      });
      setConfirmDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to mark order',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsMarking(false);
    }
  };

  const resetSearch = () => {
    setTokenInput('');
    setOrderResult(null);
    setNotFound(false);
    inputRef.current?.focus();
  };

  const formatMealType = (type: string) => type.replace('_', ' ');

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Verify Token</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Token Verification</h1>
          <p className="text-muted-foreground">
            Enter or scan a student's order token to verify and fulfill their order
          </p>
        </div>

        {/* Search Input */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <CardTitle>Enter Token</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Enter 8-character token (e.g., A1B2C3D4)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="font-mono text-lg tracking-wider uppercase"
                maxLength={8}
              />
              <Button onClick={searchToken} disabled={isSearching || !tokenInput.trim()}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {isSearching && (
          <Card>
            <CardContent className="py-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {notFound && (
          <Card className="border-destructive">
            <CardContent className="py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Token Not Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No approved order found with token: <span className="font-mono font-bold">{tokenInput}</span>
                </p>
                <Button variant="outline" onClick={resetSearch}>
                  Try Another Token
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {orderResult && (
          <Card className={`border-2 ${orderResult.is_fulfilled ? 'border-green-500 bg-green-50' : 'border-primary'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    orderResult.is_fulfilled ? 'bg-green-500' : 'bg-primary'
                  }`}>
                    <Ticket className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="font-mono tracking-wider">{orderResult.token}</CardTitle>
                    <CardDescription>
                      {orderResult.is_fulfilled ? 'Already collected' : 'Ready for collection'}
                    </CardDescription>
                  </div>
                </div>
                {orderResult.is_fulfilled ? (
                  <Badge className="bg-green-600">Fulfilled</Badge>
                ) : (
                  <Badge variant="secondary">Pending Collection</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{orderResult.profiles?.name || 'Unknown Student'}</p>
                  <p className="text-sm text-muted-foreground">{orderResult.profiles?.email || 'No email'}</p>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Menu Item</p>
                  <p className="font-medium">{orderResult.menus.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium text-lg">{orderResult.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Meal Type</p>
                  <p className="capitalize">{formatMealType(orderResult.menus.meal_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Menu Date</p>
                  <p>{format(parseISO(orderResult.menus.menu_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p>₹{orderResult.menus.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-primary">₹{(orderResult.menus.price * orderResult.quantity).toFixed(2)}</p>
                </div>
              </div>

              {orderResult.is_fulfilled && orderResult.fulfilled_at && (
                <div className="p-3 bg-green-100 rounded-lg text-green-800 text-sm">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Collected on {format(parseISO(orderResult.fulfilled_at), 'MMM d, yyyy at h:mm a')}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {!orderResult.is_fulfilled && (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700" 
                    onClick={() => setConfirmDialogOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Collected
                  </Button>
                )}
                <Button variant="outline" onClick={resetSearch} className={orderResult.is_fulfilled ? 'flex-1' : ''}>
                  {orderResult.is_fulfilled ? 'Verify Another' : 'Cancel'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Order Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure the student has collected their order?
              <br /><br />
              <strong>Token:</strong> {orderResult?.token}<br />
              <strong>Student:</strong> {orderResult?.profiles?.name}<br />
              <strong>Item:</strong> {orderResult?.menus.title} x {orderResult?.quantity}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarking}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={markAsFulfilled} 
              disabled={isMarking}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMarking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Collection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
