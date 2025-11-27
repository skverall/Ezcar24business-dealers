/**
 * User Activity Logs Modal Component
 */

import React, { useState, useEffect } from 'react';
import { X, Activity, Clock, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminUser, UserActivityLog } from '@/types/admin';
import { AdminApi } from '@/utils/adminApi';
import { formatDistanceToNow, format } from 'date-fns';

interface UserActivityLogsModalProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
}

const UserActivityLogsModal: React.FC<UserActivityLogsModalProps> = ({ 
  user, 
  isOpen, 
  onClose 
}) => {
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadActivityLogs();
    }
  }, [isOpen, user]);

  const loadActivityLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminApi.getUserActivityLogs(user.user_id, 100, 0);
      
      if (response.success && response.data) {
        setLogs(response.data);
      } else {
        setError(response.error || 'Failed to load activity logs');
      }
    } catch (error) {
      console.error('Error loading activity logs:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('suspended') || action.includes('deleted')) return 'destructive';
    if (action.includes('updated') || action.includes('verified')) return 'default';
    if (action.includes('created') || action.includes('unsuspended')) return 'secondary';
    return 'outline';
  };

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderLogDetails = (details: any) => {
    if (!details) return null;

    return (
      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
        <pre className="whitespace-pre-wrap text-gray-600">
          {JSON.stringify(details, null, 2)}
        </pre>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Activity Logs</h2>
              <p className="text-sm text-gray-500">
                {user.full_name || user.email}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading activity logs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Failed to load activity logs</p>
              <p className="text-red-600 text-sm">{error}</p>
              <Button onClick={loadActivityLogs} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No activity logs found</p>
              <p className="text-gray-500 text-sm">
                This user has no recorded activity logs yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Activity History ({logs.length} entries)
                </h3>
                <Button variant="outline" size="sm" onClick={loadActivityLogs}>
                  Refresh
                </Button>
              </div>

              <div className="space-y-3">
                {logs.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {formatActionName(log.action)}
                            </Badge>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                            </div>
                          </div>

                          {log.admin_username && (
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <User className="w-4 h-4 mr-1" />
                              <span>Performed by: <strong>{log.admin_username}</strong></span>
                            </div>
                          )}

                          {log.details && renderLogDetails(log.details)}

                          {(log.ip_address || log.user_agent) && (
                            <div className="mt-2 text-xs text-gray-500 space-y-1">
                              {log.ip_address && (
                                <div>IP: {log.ip_address}</div>
                              )}
                              {log.user_agent && (
                                <div className="truncate">
                                  User Agent: {log.user_agent}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 ml-4">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserActivityLogsModal;
