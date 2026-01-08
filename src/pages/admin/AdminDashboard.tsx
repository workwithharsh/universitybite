import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMenus } from '@/hooks/useMenus';
import { useAllOrders } from '@/hooks/useOrders';
import { useOrderStatistics } from '@/hooks/useStatistics';
import { 
  ClipboardList, 
  History, 
  BarChart3, 
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  TrendingUp
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: menus, isLoading: menusLoading } = useMenus();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: stats, isLoading: statsLoading } = useOrderStatistics();

  const pendingOrders = orders?.filter((o) => o.status === 'pending').length || 0;
  const approvedOrders = orders?.filter((o) => o.status === 'approved').length || 0;
  const rejectedOrders = orders?.filter((o) => o.status === 'rejected').length || 0;
  const openMenus = menus?.filter((m) => m.status === 'open').length || 0;

  const statCards = [
    {
      title: 'Pending Orders',
      value: pendingOrders,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Approved Orders',
      value: approvedOrders,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Rejected Orders',
      value: rejectedOrders,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Open Menus',
      value: openMenus,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage food menus and student orders
            </p>
          </div>
          <Link to="/admin/menus/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Menu
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(menusLoading || ordersLoading) ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription>{stat.title}</CardDescription>
                    <div className={`p-2 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/admin/menus" className="block">
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Manage Menus</CardTitle>
                <CardDescription>
                  Create, edit, and delete food menus. Set quantities and deadlines.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/admin/orders" className="block">
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>View Orders</CardTitle>
                <CardDescription>
                  Review student orders. Approve or reject pending orders.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/admin/statistics" className="block">
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>
                  View order trends, meal-wise demand, and analytics.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Pending Orders */}
        {pendingOrders > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Pending Orders
                  </CardTitle>
                  <CardDescription>
                    {pendingOrders} orders waiting for approval
                  </CardDescription>
                </div>
                <Link to="/admin/orders">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
