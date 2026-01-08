import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMenu, useCreateMenu, useUpdateMenu } from '@/hooks/useMenus';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2, Upload, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MealType, MenuStatus } from '@/types/database';

export default function AdminMenuForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: existingMenu, isLoading: menuLoading } = useMenu(id || '');
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [menuDate, setMenuDate] = useState<Date>(new Date());
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [orderDeadline, setOrderDeadline] = useState<Date>(new Date());
  const [deadlineTime, setDeadlineTime] = useState('12:00');
  const [totalQuantity, setTotalQuantity] = useState(50);
  const [status, setStatus] = useState<MenuStatus>('open');
  const [isUploading, setIsUploading] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');

  // Populate form when editing
  useEffect(() => {
    if (existingMenu) {
      setTitle(existingMenu.title);
      setDescription(existingMenu.description || '');
      setImageUrl(existingMenu.image_url || '');
      setMenuDate(new Date(existingMenu.menu_date));
      setMealType(existingMenu.meal_type);
      setOrderDeadline(new Date(existingMenu.order_deadline));
      setDeadlineTime(format(new Date(existingMenu.order_deadline), 'HH:mm'));
      setTotalQuantity(existingMenu.total_quantity);
      setStatus(existingMenu.status);
      if (existingMenu.image_url) {
        setImageTab('url');
      }
    }
  }, [existingMenu]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time for deadline
    const [hours, minutes] = deadlineTime.split(':').map(Number);
    const fullDeadline = new Date(orderDeadline);
    fullDeadline.setHours(hours, minutes, 0, 0);

    const menuData = {
      title,
      description: description || null,
      image_url: imageUrl || null,
      menu_date: format(menuDate, 'yyyy-MM-dd'),
      meal_type: mealType,
      order_deadline: fullDeadline.toISOString(),
      total_quantity: totalQuantity,
      remaining_quantity: isEditing ? existingMenu?.remaining_quantity || totalQuantity : totalQuantity,
      status,
      created_by: user?.id || null,
    };

    try {
      if (isEditing && id) {
        await updateMenu.mutateAsync({ id, ...menuData });
      } else {
        await createMenu.mutateAsync(menuData);
      }
      navigate('/admin/menus');
    } catch (error) {
      // Error is handled by the mutation hooks
    }
  };

  if (isEditing && menuLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/menus')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Menu' : 'Create Menu'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Update the menu details' : 'Add a new food menu item'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Menu Details</CardTitle>
              <CardDescription>
                Fill in the information for this menu item
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Chicken Biryani"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the menu item..."
                  rows={3}
                />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label>Image</Label>
                <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as 'upload' | 'url')}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="upload">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="url">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      URL
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-2">
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                      {isUploading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="mt-2">
                    <Input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </TabsContent>
                </Tabs>
                {imageUrl && (
                  <div className="mt-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full max-w-xs h-32 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>

              {/* Date & Meal Type */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Menu Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !menuDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(menuDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={menuDate}
                        onSelect={(date) => date && setMenuDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Meal Type *</Label>
                  <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Deadline */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Order Deadline Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !orderDeadline && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(orderDeadline, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={orderDeadline}
                        onSelect={(date) => date && setOrderDeadline(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadlineTime">Deadline Time *</Label>
                  <Input
                    id="deadlineTime"
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Quantity & Status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Total Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as MenuStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/menus')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMenu.isPending || updateMenu.isPending}
                >
                  {(createMenu.isPending || updateMenu.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? 'Update Menu' : 'Create Menu'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
