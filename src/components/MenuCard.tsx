import { useState } from 'react';
import { format, isPast, parseISO } from 'date-fns';
import type { Menu, Order } from '@/types/database';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, Minus, Plus, Loader2, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatPrice = (price: number) => `₹${price.toFixed(2)}`;

interface MenuCardProps {
  menu: Menu;
  existingOrder?: Order | null;
  onOrder?: (quantity: number) => void;
  isOrdering?: boolean;
  showOrderButton?: boolean;
}

export function MenuCard({ 
  menu, 
  existingOrder, 
  onOrder, 
  isOrdering = false,
  showOrderButton = true 
}: MenuCardProps) {
  const [quantity, setQuantity] = useState(1);
  
  const deadlinePassed = isPast(parseISO(menu.order_deadline));
  const isAvailable = menu.status === 'open' && !deadlinePassed && menu.remaining_quantity > 0;
  const canOrder = isAvailable && !existingOrder;

  const mealTypeColors = {
    breakfast: 'bg-amber-100 text-amber-800 border-amber-200',
    lunch: 'bg-blue-100 text-blue-800 border-blue-200',
    dinner: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(menu.remaining_quantity, prev + delta)));
  };

  return (
    <Card className={cn(
      'overflow-hidden transition-all hover:shadow-md',
      !isAvailable && 'opacity-75'
    )}>
      {menu.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={menu.image_url}
            alt={menu.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">{menu.title}</CardTitle>
            {menu.description && (
              <CardDescription>{menu.description}</CardDescription>
            )}
            <p className="text-lg font-bold text-primary">{formatPrice(menu.price)}</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn('capitalize shrink-0', mealTypeColors[menu.meal_type])}
          >
            {menu.meal_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              Order by {format(parseISO(menu.order_deadline), 'MMM d, h:mm a')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>
              {menu.remaining_quantity} / {menu.total_quantity} available
            </span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex gap-2">
          <Badge variant={menu.status === 'open' ? 'default' : 'secondary'}>
            {menu.status === 'open' ? 'Open' : 'Closed'}
          </Badge>
          {deadlinePassed && (
            <Badge variant="destructive">Deadline Passed</Badge>
          )}
          {menu.remaining_quantity === 0 && (
            <Badge variant="destructive">Sold Out</Badge>
          )}
        </div>

        {/* Existing order status */}
        {existingOrder && (
          <div className={cn(
            'p-3 rounded-md border',
            existingOrder.status === 'approved' && 'bg-green-50 border-green-200',
            existingOrder.status === 'pending' && 'bg-amber-50 border-amber-200',
            existingOrder.status === 'rejected' && 'bg-red-50 border-red-200'
          )}>
            <p className="text-sm font-medium">
              Your order: {existingOrder.quantity} item(s)
            </p>
            <p className={cn(
              'text-sm capitalize',
              existingOrder.status === 'approved' && 'text-green-700',
              existingOrder.status === 'pending' && 'text-amber-700',
              existingOrder.status === 'rejected' && 'text-red-700'
            )}>
              Status: {existingOrder.status}
            </p>
          </div>
        )}
      </CardContent>

      {showOrderButton && canOrder && onOrder && (
        <CardFooter className="flex gap-3 pt-0">
          {/* Quantity selector */}
          <div className="flex items-center gap-2 border rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= menu.remaining_quantity}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            onClick={() => onOrder(quantity)} 
            disabled={isOrdering}
            className="flex-1"
          >
            {isOrdering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ordering...
              </>
            ) : (
              'Place Order'
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
