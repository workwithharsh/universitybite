import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { useMenus, useDeleteMenu, useUpdateMenu } from '@/hooks/useMenus';
import { Plus, Pencil, Trash2, ClipboardList, Play, Pause } from 'lucide-react';
import type { Menu } from '@/types/database';

export default function AdminMenus() {
  const { data: menus, isLoading } = useMenus();
  const deleteMenu = useDeleteMenu();
  const updateMenu = useUpdateMenu();
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);

  const handleDeleteMenu = async () => {
    if (menuToDelete) {
      await deleteMenu.mutateAsync(menuToDelete.id);
      setMenuToDelete(null);
    }
  };

  const handleToggleStatus = async (menu: Menu) => {
    await updateMenu.mutateAsync({
      id: menu.id,
      status: menu.status === 'open' ? 'closed' : 'open',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">
              Create and manage food menus
            </p>
          </div>
          <Link to="/admin/menus/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Menu
            </Button>
          </Link>
        </div>

        {/* Menus Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <CardTitle>All Menus</CardTitle>
            </div>
            <CardDescription>
              {menus?.length || 0} total menu items
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : menus && menus.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Menu Item</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menus.map((menu) => (
                      <TableRow key={menu.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {menu.image_url ? (
                              <img
                                src={menu.image_url}
                                alt={menu.title}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p>{menu.title}</p>
                              {menu.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {menu.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(menu.menu_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="capitalize">
                          {menu.meal_type}
                        </TableCell>
                        <TableCell>
                          <span className="text-primary font-medium">
                            {menu.remaining_quantity}
                          </span>
                          <span className="text-muted-foreground">
                            {' '}/ {menu.total_quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(menu.order_deadline), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={menu.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(menu)}
                              title={menu.status === 'open' ? 'Close menu' : 'Open menu'}
                            >
                              {menu.status === 'open' ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Link to={`/admin/menus/${menu.id}/edit`}>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setMenuToDelete(menu)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                  <ClipboardList className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No Menus Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first menu to start accepting food orders.
                </p>
                <Link to="/admin/menus/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Menu
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Menu Dialog */}
      <AlertDialog open={!!menuToDelete} onOpenChange={() => setMenuToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{menuToDelete?.title}</strong>? This will also delete all
              associated orders. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMenu}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Menu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
