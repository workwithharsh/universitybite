import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentOrders from "./pages/student/StudentOrders";
import StudentBills from "./pages/student/StudentBills";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMenus from "./pages/admin/AdminMenus";
import AdminMenuForm from "./pages/admin/AdminMenuForm";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminStatistics from "./pages/admin/AdminStatistics";
import AdminTokenVerify from "./pages/admin/AdminTokenVerify";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={role === 'admin' ? '/admin' : '/student'} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/orders" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentOrders />
              </ProtectedRoute>
            } />
            <Route path="/student/bills" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentBills />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/menus" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMenus />
              </ProtectedRoute>
            } />
            <Route path="/admin/menus/new" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMenuForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/menus/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMenuForm />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOrders />
              </ProtectedRoute>
            } />
            <Route path="/admin/statistics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminStatistics />
              </ProtectedRoute>
            } />
            <Route path="/admin/verify-token" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTokenVerify />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
