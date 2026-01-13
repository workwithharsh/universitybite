import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TokenDisplayProps {
  token: string;
  menuTitle: string;
  quantity: number;
  isFulfilled: boolean;
}

export function TokenDisplay({ token, menuTitle, quantity, isFulfilled }: TokenDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast({
        title: 'Token copied!',
        description: 'The token has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the token manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={`border-2 ${isFulfilled ? 'border-muted bg-muted/50' : 'border-primary'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Order Token</CardTitle>
          </div>
          {isFulfilled && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Collected
            </Badge>
          )}
        </div>
        <CardDescription>
          Show this token to collect your order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className={`flex-1 font-mono text-2xl font-bold tracking-wider text-center py-3 rounded-lg ${
            isFulfilled ? 'bg-muted text-muted-foreground line-through' : 'bg-primary/10 text-primary'
          }`}>
            {token}
          </div>
          {!isFulfilled && (
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium">{menuTitle}</span> • Qty: {quantity}
        </div>
      </CardContent>
    </Card>
  );
}
