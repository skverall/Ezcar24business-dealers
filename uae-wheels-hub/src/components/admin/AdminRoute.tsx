/**
 * Admin route protection component
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'moderator' | 'super_admin';
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  requiredRole = 'admin' 
}) => {
  const { isAuthenticated, isLoading, user } = useAdminAuth();
  const location = useLocation();
  const [showUnauthorized, setShowUnauthorized] = useState(false);

  useEffect(() => {
    // Reset unauthorized state when location changes
    setShowUnauthorized(false);
  }, [location]);

  useEffect(() => {
    // Show unauthorized message if user doesn't have required role
    if (isAuthenticated && user && !hasRequiredRole(user.role, requiredRole)) {
      setShowUnauthorized(true);
    }
  }, [isAuthenticated, user, requiredRole]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-gray-600 font-medium">Verifying admin access...</p>
            <p className="text-sm text-gray-500">Please wait while we authenticate your session</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't redirect if not authenticated - let AdminPanel handle login
  // AdminPanel will show login form when not authenticated

  // Show unauthorized message if user doesn't have required role (only if authenticated)
  if (isAuthenticated && (showUnauthorized || !hasRequiredRole(user?.role || '', requiredRole))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              You don't have permission to access this area.
            </p>
          </div>

          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Required Role:</strong> {formatRoleName(requiredRole)}
              <br />
              <strong>Your Role:</strong> {formatRoleName(user?.role || '')}
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              If you believe this is an error, please contact your system administrator.
            </p>
            <button
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
};

/**
 * Check if user has required role
 */
const hasRequiredRole = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    'moderator': 1,
    'admin': 2,
    'super_admin': 3
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
};

/**
 * Format role name for display
 */
const formatRoleName = (role: string): string => {
  switch (role) {
    case 'super_admin':
      return 'Super Administrator';
    case 'admin':
      return 'Administrator';
    case 'moderator':
      return 'Moderator';
    default:
      return role || 'Unknown';
  }
};

export default AdminRoute;
