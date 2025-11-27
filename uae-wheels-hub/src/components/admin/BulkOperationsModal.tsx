/**
 * Bulk Operations Modal Component
 */

import React, { useState } from 'react';
import { X, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AdminUser, BulkOperationResult } from '@/types/admin';
import { AdminApi } from '@/utils/adminApi';

interface BulkOperationsModalProps {
  selectedUsers: AdminUser[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type BulkOperation = 'suspend' | 'unsuspend' | 'verify' | 'export' | 'delete';

const BulkOperationsModal: React.FC<BulkOperationsModalProps> = ({ 
  selectedUsers, 
  isOpen, 
  onClose, 
  onComplete 
}) => {
  const [operation, setOperation] = useState<BulkOperation>('suspend');
  const [reason, setReason] = useState('');
  const [durationHours, setDurationHours] = useState(24);
  const [verificationStatus, setVerificationStatus] = useState('verified');
  const [includeActivityLogs, setIncludeActivityLogs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkOperationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const userIds = selectedUsers.map(user => user.user_id);
      let response;

      switch (operation) {
        case 'suspend':
          response = await AdminApi.bulkSuspendUsers(
            userIds, 
            true, 
            'admin-user-id', // TODO: Get actual admin user ID
            durationHours, 
            reason
          );
          break;
        case 'unsuspend':
          response = await AdminApi.bulkSuspendUsers(
            userIds, 
            false, 
            'admin-user-id', // TODO: Get actual admin user ID
            0, 
            reason
          );
          break;
        case 'verify':
          response = await AdminApi.bulkUpdateVerification(
            userIds, 
            verificationStatus, 
            'admin-user-id', // TODO: Get actual admin user ID
            reason
          );
          break;
        case 'export':
          response = await AdminApi.exportUsersData(userIds, includeActivityLogs);
          if (response.success && response.data) {
            // Download the data as JSON file
            const blob = new Blob([JSON.stringify(response.data, null, 2)], {
              type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          break;
        case 'delete':
          if (!confirm(`This will permanently delete ${selectedUsers.length} user(s). This cannot be undone. Continue?`)) {
            setLoading(false);
            return;
          }
          response = await AdminApi.bulkDeleteUsers(userIds);
          break;
      }

      if (response?.success) {
        setResult(response.data);
        if (operation !== 'export') {
          onComplete();
        }
      } else {
        setError(response?.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getOperationTitle = () => {
    switch (operation) {
      case 'suspend': return 'Bulk Suspend Users';
      case 'unsuspend': return 'Bulk Unsuspend Users';
      case 'verify': return 'Bulk Update Verification';
      case 'export': return 'Export User Data';
      case 'delete': return 'Bulk Delete Users';
      default: return 'Bulk Operation';
    }
  };

  const getOperationDescription = () => {
    switch (operation) {
      case 'suspend': return `Suspend ${selectedUsers.length} selected users`;
      case 'unsuspend': return `Unsuspend ${selectedUsers.length} selected users`;
      case 'verify': return `Update verification status for ${selectedUsers.length} selected users`;
      case 'export': return `Export data for ${selectedUsers.length} selected users`;
      case 'delete': return `Permanently delete ${selectedUsers.length} selected users`;
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">{getOperationTitle()}</h2>
              <p className="text-sm text-gray-500">{getOperationDescription()}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Operation Selection */}
          <div>
            <Label htmlFor="operation">Operation</Label>
            <Select value={operation} onValueChange={(value: BulkOperation) => setOperation(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suspend">Suspend Users</SelectItem>
                <SelectItem value="unsuspend">Unsuspend Users</SelectItem>
                <SelectItem value="verify">Update Verification</SelectItem>
                <SelectItem value="export">Export Data</SelectItem>
                <SelectItem value="delete">Delete Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suspend Duration */}
          {operation === 'suspend' && (
            <div>
              <Label htmlFor="duration">Suspension Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="8760"
                value={durationHours}
                onChange={(e) => setDurationHours(parseInt(e.target.value))}
                placeholder="24"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum 8760 hours (1 year)
              </p>
            </div>
          )}

          {/* Verification Status */}
          {operation === 'verify' && (
            <div>
              <Label htmlFor="verification_status">Verification Status</Label>
              <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select verification status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Export Options */}
          {operation === 'export' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include_logs"
                  title="Include activity logs"
                  aria-label="Include activity logs"
                  checked={includeActivityLogs}
                  onChange={(e) => setIncludeActivityLogs(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="include_logs">Include activity logs</Label>
              </div>
              <p className="text-xs text-gray-500">
                Activity logs will significantly increase file size
              </p>
            </div>
          )}

          {/* Reason */}
          {operation !== 'export' && (
            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for this bulk operation..."
                rows={3}
              />
            </div>
          )}

          {/* Selected Users Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Selected Users ({selectedUsers.length})</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedUsers.slice(0, 5).map((user) => (
                <div key={user.user_id} className="text-sm text-gray-600">
                  {user.full_name || user.email} ({user.email})
                </div>
              ))}
              {selectedUsers.length > 5 && (
                <div className="text-sm text-gray-500">
                  ... and {selectedUsers.length - 5} more users
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-600 font-medium">Operation Failed</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-green-600 font-medium">Operation Completed</p>
                <p className="text-green-600 text-sm">{result.message}</p>
                {result.success_count > 0 && (
                  <p className="text-green-600 text-sm">
                    Successfully processed: {result.success_count}
                  </p>
                )}
                {result.error_count > 0 && (
                  <p className="text-orange-600 text-sm">
                    Failed: {result.error_count}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Execute ${getOperationTitle()}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkOperationsModal;
