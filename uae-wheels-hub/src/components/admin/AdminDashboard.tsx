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
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { formatDistanceToNow } from 'date-fns';
import EmailTestComponent from './EmailTestComponent';
import QuickEmailTest from './QuickEmailTest';
import AdminSystemCheck from './AdminSystemCheck';

interface AdminDashboardProps {
  onChangePassword?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onChangePassword: _onChangePassword }) => {
  const { dashboardStats, loadDashboardStats, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [showEmailTest, setShowEmailTest] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const handleCardClick = (section: string) => {
    navigate(`/admin/${section}`);
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
    <div className="space-y-8 p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-50 to-white relative group"
          onClick={() => handleCardClick('listings')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Car className="w-24 h-24 text-blue-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-blue-900">
              Total Listings
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Car className="h-5 w-5 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-900">
              {dashboardStats?.listings.total || 0}
            </div>
            <p className="text-sm text-blue-700 mt-1 flex items-center gap-1">
              <span className="font-medium">{dashboardStats?.listings.active || 0}</span> active listings
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-none shadow-md bg-gradient-to-br from-green-50 to-white relative group"
          onClick={() => handleCardClick('users')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-24 h-24 text-green-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-green-900">
              Total Users
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Users className="h-5 w-5 text-green-700" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-900">
              {dashboardStats?.users.total || 0}
            </div>
            <p className="text-sm text-green-700 mt-1 flex items-center gap-1">
              <span className="font-medium">{dashboardStats?.users.active || 0}</span> active this month
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-none shadow-md bg-gradient-to-br from-purple-50 to-white relative group"
          onClick={() => handleCardClick('messages')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="w-24 h-24 text-purple-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-purple-900">
              Messages
            </CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <MessageSquare className="h-5 w-5 text-purple-700" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-900">
              {dashboardStats?.messages.total || 0}
            </div>
            <p className="text-sm text-purple-700 mt-1">
              Total conversations
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-none shadow-md bg-gradient-to-br from-orange-50 to-white relative group"
          onClick={() => handleCardClick('pending')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-24 h-24 text-orange-600" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-orange-900">
              Pending Review
            </CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <AlertTriangle className="h-5 w-5 text-orange-700" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-orange-900">
              {dashboardStats?.listings.pending || 0}
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Listings awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Testing Section */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">System Configuration</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEmailTest(!showEmailTest)}
          className="flex items-center gap-2 hover:bg-gray-100"
        >
          <MessageSquare className="h-4 w-4" />
          {showEmailTest ? 'Hide Email Test' : 'Test Email System'}
        </Button>
      </div>

      {showEmailTest && (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
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
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Recent Admin Activity</span>
          </CardTitle>
          <CardDescription>
            Latest administrative actions performed in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {dashboardStats?.recent_activities && dashboardStats.recent_activities.length > 0 ? (
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />

              {dashboardStats.recent_activities.map((activity, index) => (
                <div key={index} className="relative pl-10 py-3 group">
                  {/* Dot */}
                  <div className="absolute left-[13px] top-5 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500 group-hover:border-blue-600 group-hover:scale-110 transition-all z-10" />

                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action.replace('_', ' ').toUpperCase()}
                        {activity.resource_type && (
                          <span className="text-gray-500 ml-1 font-normal">
                            on {activity.resource_type}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                          {(activity.admin_username || 'S').charAt(0).toUpperCase()}
                        </span>
                        by {activity.admin_username || 'System'}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No recent activity to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
