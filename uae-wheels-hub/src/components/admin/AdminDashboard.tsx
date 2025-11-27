/**
 * Admin dashboard component
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Users,
  MessageSquare,
  Activity,
  LogOut,
  Settings,
  Shield,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { formatDistanceToNow } from 'date-fns';
import EmailTestComponent from './EmailTestComponent';
import QuickEmailTest from './QuickEmailTest';
import AdminSystemCheck from './AdminSystemCheck';

interface AdminDashboardProps {
  onChangePassword?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onChangePassword }) => {
  const { user, logout, dashboardStats, loadDashboardStats, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [showEmailTest, setShowEmailTest] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const handleSettings = () => {
    onChangePassword?.();
  };

  const handleCardClick = (section: string) => {
    navigate(`/admin/${section}`);
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



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-gray-50 hover:scale-105 group"
            onClick={() => handleCardClick('listings')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                Total Listings
              </CardTitle>
              <div className="flex items-center gap-1">
                <Car className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-blue-600 transition-colors">
                {dashboardStats?.listings.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.listings.active || 0} active
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-gray-50 hover:scale-105 group"
            onClick={() => handleCardClick('users')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-green-600 transition-colors">
                Total Users
              </CardTitle>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground group-hover:text-green-600 transition-colors" />
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-green-600 transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-green-600 transition-colors">
                {dashboardStats?.users.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.users.active || 0} active this month
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-gray-50 hover:scale-105 group"
            onClick={() => handleCardClick('messages')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-colors">
                Messages
              </CardTitle>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-purple-600 transition-colors">
                {dashboardStats?.messages.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total conversations
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-gray-50 hover:scale-105 group"
            onClick={() => handleCardClick('pending')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-orange-600 transition-colors">
                Pending Review
              </CardTitle>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-muted-foreground group-hover:text-orange-600 transition-colors" />
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-orange-600 transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold group-hover:text-orange-600 transition-colors">
                {dashboardStats?.listings.pending || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Listings awaiting approval
              </p>
            </CardContent>
          </Card>
      </div>

      {/* Email Testing Section */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">System Configuration</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEmailTest(!showEmailTest)}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          {showEmailTest ? 'Hide Email Test' : 'Test Email System'}
        </Button>
      </div>

      {showEmailTest && (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AdminSystemCheck />
            <EmailTestComponent />
          </div>
          <div>
            <QuickEmailTest />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent Admin Activity</span>
          </CardTitle>
          <CardDescription>
            Latest administrative actions performed in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardStats?.recent_activities && dashboardStats.recent_activities.length > 0 ? (
            <div className="space-y-4">
              {dashboardStats.recent_activities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">
                        {activity.action.replace('_', ' ').toUpperCase()}
                        {activity.resource_type && (
                          <span className="text-gray-500 ml-1">
                            ({activity.resource_type})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {activity.admin_username || 'System'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
