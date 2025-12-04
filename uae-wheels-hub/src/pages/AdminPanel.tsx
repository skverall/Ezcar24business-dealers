/**
 * Main admin panel page with nested routing
 */

import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Routes, Route, useParams } from 'react-router-dom';
import {
  Shield,
  Users,
  Car,
  AlertTriangle,
  MessageSquare,
  Settings,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLogin from '@/components/admin/AdminLogin';
import ChangePasswordModal from '@/components/admin/ChangePasswordModal';
import { Badge } from '@/components/ui/badge';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

// Lazy load admin components
const AdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));
const UserManagement = lazy(() => import('../components/admin/UserManagement'));
const ListingsManagement = lazy(() => import('../components/admin/ListingsManagement'));
const PendingReviewsManagement = lazy(() => import('../components/admin/PendingReviewsManagement'));
const MessagesManagement = lazy(() => import('../components/admin/MessagesManagement'));
const AdminSettings = lazy(() => import('../components/admin/AdminSettings'));
const ReportAccessManager = lazy(() => import('../components/admin/ReportAccessManager'));

const AdminPanel: React.FC = () => {
  const { isAuthenticated, isLoading, validateSession, user, logout, dashboardStats } = useAdminAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useParams();
  const { i18n } = useTranslation();

  // Get current language from params or fallback to i18n
  const currentLang = lang || i18n.language || 'en';
  const adminBasePath = `/${currentLang}/admin`;

  // Handle successful login
  const handleLoginSuccess = () => {
    // Force re-validation of session to update authentication state
    setTimeout(() => {
      validateSession();
    }, 100); // Small delay to ensure token is stored
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatRoleName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Administrator';
      case 'moderator':
        return 'Moderator';
      default:
        return role;
    }
  };

  const navigationItems = [
    { path: adminBasePath, label: 'Dashboard', icon: Shield, exact: true },
    { path: `${adminBasePath}/users`, label: 'Users', icon: Users, count: dashboardStats?.users.total },
    { path: `${adminBasePath}/listings`, label: 'Listings', icon: Car, count: dashboardStats?.listings.total },
    { path: `${adminBasePath}/pending`, label: 'Pending', icon: AlertTriangle, count: dashboardStats?.listings.pending },
    { path: `${adminBasePath}/messages`, label: 'Messages', icon: MessageSquare, count: dashboardStats?.messages.total },
    { path: `${adminBasePath}/reports`, label: 'Reports', icon: Car },
    { path: `${adminBasePath}/settings`, label: 'Settings', icon: Settings },
  ];

  const isActivePath = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Show admin panel with nested routes
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              type="button"
              onClick={() => navigate(adminBasePath)}
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <Shield className="w-8 h-8 text-blue-600" />
              <div className="text-left">
                <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">EzCar24.com Administration</p>
              </div>
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.full_name || user?.username}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(user?.role || '')}>
                    {formatRoleName(user?.role || '')}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangePassword(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path, item.exact);

              return (
                <button
                  type="button"
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {item.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Breadcrumbs */}
      {location.pathname !== '/admin' && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <button
                type="button"
                onClick={() => navigate(adminBasePath)}
                className="hover:text-blue-600 transition-colors"
              >
                Dashboard
              </button>
              <span>/</span>
              <span className="text-gray-900 font-medium">
                {navigationItems.find(item => isActivePath(item.path))?.label || 'Page'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route index element={
            <Suspense fallback={<div className="flex justify-center items-center py-8">Loading...</div>}>
              <AdminDashboard />
            </Suspense>
          } />
          <Route path="users" element={
            <Suspense fallback={<div className="flex justify-center items-center py-8">Loading...</div>}>
              <UserManagement />
            </Suspense>
          } />
          <Route path="listings" element={
            <Suspense fallback={<div className="flex justify-center items-center py-8">Loading...</div>}>
              <ListingsManagement />
            </Suspense>
          } />
          <Route path="pending" element={
            <Suspense fallback={<div className="flex justify-center items-center py-8">Loading...</div>}>
              <PendingReviewsManagement />
            </Suspense>
          } />
          <Route path="messages" element={
            <Suspense fallback={<div className="flex justify-center items-center py-8">Loading...</div>}>
              <MessagesManagement />
            </Suspense>
          } />
          <Route path="reports" element={
            <Suspense fallback={<div className="flex justify-center items-center py-8">Loading...</div>}>
              <ReportAccessManager />
            </Suspense>
          } />
          <Route path="settings" element={
            <Suspense fallback={<div className="flex justify-center items-center py-8">Loading...</div>}>
              <AdminSettings />
            </Suspense>
          } />
        </Routes>
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default AdminPanel;
