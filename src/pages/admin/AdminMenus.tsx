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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMenus, useDeleteMenu, useUpdateMenu } from '@/hooks/useMenus';
import { Plus, Pencil, Trash2, ClipboardList, Play, Pause, MoreVertical, Calendar, Clock, IndianRupee } from 'lucide-react';
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

  // Mobile card component
  const MenuMobileCard = ({ menu }: { menu: Menu }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {menu.image_url ? (
              <img
                src={menu.image_url}
                alt={menu.title}
                className="w-14 h-14 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{menu.title}</h4>
              {menu.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{menu.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge status={menu.status} />
                <span className="text-xs capitalize text-muted-foreground">{menu.meal_type}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover z-50">
              <DropdownMenuItem onClick={() => handleToggleStatus(menu)}>
                {menu.status === 'open' ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> Close Menu
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Open Menu
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/admin/menus/${menu.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setMenuToDelete(menu)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(parseISO(menu.menu_date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{format(parseISO(menu.order_deadline), 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-primary font-medium">{menu.remaining_quantity}</span>
            <span className="text-muted-foreground">/ {menu.total_quantity}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <IndianRupee className="h-3.5 w-3.5" />
            <span>{menu.price.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Menu
            </Button>
          </Link>
        </div>

        {/* Menus */}
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
              <>
                {/* Mobile View */}
                <div className="md:hidden">
                  {menus.map((menu) => (
                    <MenuMobileCard key={menu.id} menu={menu} />
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover z-50">
                                <DropdownMenuItem onClick={() => handleToggleStatus(menu)}>
                                  {menu.status === 'open' ? (
                                    <>
                                      <Pause className="mr-2 h-4 w-4" /> Close Menu
                                    </>
                                  ) : (
                                    <>
                                      <Play className="mr-2 h-4 w-4" /> Open Menu
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/menus/${menu.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setMenuToDelete(menu)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
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
