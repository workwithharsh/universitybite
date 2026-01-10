import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  UtensilsCrossed, 
  LayoutDashboard, 
  ClipboardList, 
  Receipt,
  History, 
  LogOut,
  Menu as MenuIcon,
  X,
  Settings,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const studentLinks = [
    { href: '/student', label: 'Menu', icon: LayoutDashboard },
    { href: '/student/orders', label: 'My Orders', icon: History },
    { href: '/student/bills', label: 'My Bills', icon: Receipt },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/menus', label: 'Menus', icon: ClipboardList },
    { href: '/admin/orders', label: 'Orders', icon: History },
    { href: '/admin/statistics', label: 'Statistics', icon: BarChart3 },
  ];

  const links = role === 'admin' ? adminLinks : studentLinks;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-foreground">University Food</h1>
              <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link key={link.href} to={link.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{profile?.name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="hidden md:flex"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link 
                    key={link.href} 
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-2',
                        isActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
