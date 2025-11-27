/**
 * User Management Component for Admin Panel
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Key,
  Activity,
  Users,
  Download,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AdminUser, UserFilters } from '@/types/admin';
import { AdminApi } from '@/utils/adminApi';
import { formatDistanceToNow } from 'date-fns';
import UserDetailsModal from './UserDetailsModal';
import UserEditModal from './UserEditModal';
// import BulkOperationsModal from './BulkOperationsModal';
import PasswordResetModal from './PasswordResetModal';
import UserActivityLogsModal from './UserActivityLogsModal';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  });
  const [statusFilter, setStatusFilter] = useState('all');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AdminApi.getUsers(filters);
      if (response.success && response.data) {
        setUsers(response.data);
        if (response.data.length > 0) {
          setTotalCount(response.data[0].total_count);
        }
      } else {
        console.error('Failed to load users:', response.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    const statusValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, status: statusValue, page: 1 }));
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSuspendUser = async (user: AdminUser) => {
    const isSuspended = user.account_status === 'suspended';
    const action = isSuspended ? 'unsuspend' : 'suspend';
    
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      const response = await AdminApi.suspendUser(user.user_id, !isSuspended);
      if (response.success) {
        loadUsers(); // Refresh the list
      } else {
        alert(`Failed to ${action} user: ${response.error}`);
      }
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const response = await AdminApi.deleteUser(user.user_id);
      if (response.success) {
        loadUsers(); // Refresh the list
      } else {
        alert(`Failed to delete user: ${response.error}`);
      }
    }
  };

  const handleApproveEmail = async (user: AdminUser) => {
    if (user.email_confirmed_at) {
      alert('Email already confirmed');
      return;
    }
    if (confirm('Approve this user\'s email and activate full profile?')) {
      const response = await AdminApi.approveUserEmail(user.user_id);
      if (response.success) {
        loadUsers();
      } else {
        alert(`Failed to approve email: ${response.error}`);
      }
    }
  };

  const handlePasswordReset = (user: AdminUser) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleViewActivity = (user: AdminUser) => {
    setSelectedUser(user);
    setShowActivityModal(true);
  };

  const handleSelectUser = (user: AdminUser, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, user]);
    } else {
      setSelectedUsers(prev => prev.filter(u => u.user_id !== user.user_id));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers([...users]);
    } else {
      setSelectedUsers([]);
    }
  };

  // Bulk operations are disabled by request
  // const handleBulkOperations = () => {
  //   if (selectedUsers.length === 0) {
  //     alert('Please select users first');
  //     return;
  //   }
  //   setShowBulkModal(true);
  // };

  const handleExportAll = async () => {
    const response = await AdminApi.exportUsersData();
    if (response.success && response.data) {
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_users_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert(`Failed to export users: ${response.error}`);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'destructive';
      case 'deleted': return 'secondary';
      case 'unconfirmed': return 'outline';
      default: return 'outline';
    }
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return <ArrowUpDown className="w-4 h-4" />;
    return filters.sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  const totalPages = Math.ceil(totalCount / filters.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
          {selectedUsers.length > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">

          <Button onClick={handleExportAll} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or user ID..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium w-12">
                    <button
                      onClick={() => handleSelectAll(selectedUsers.length !== users.length)}
                      className="flex items-center justify-center"
                    >
                      {selectedUsers.length === users.length && users.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : selectedUsers.length > 0 ? (
                        <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                          <div className="w-2 h-0.5 bg-white"></div>
                        </div>
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('email')}
                      className="h-auto p-0 font-medium"
                    >
                      Email {getSortIcon('email')}
                    </Button>
                  </th>
                  <th className="text-left p-4 font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('full_name')}
                      className="h-auto p-0 font-medium"
                    >
                      Name {getSortIcon('full_name')}
                    </Button>
                  </th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('created_at')}
                      className="h-auto p-0 font-medium"
                    >
                      Registered {getSortIcon('created_at')}
                    </Button>
                  </th>
                  <th className="text-left p-4 font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('last_sign_in_at')}
                      className="h-auto p-0 font-medium"
                    >
                      Last Login {getSortIcon('last_sign_in_at')}
                    </Button>
                  </th>
                  <th className="text-left p-4 font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('listings_count')}
                      className="h-auto p-0 font-medium"
                    >
                      Listings {getSortIcon('listings_count')}
                    </Button>
                  </th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isSelected = selectedUsers.some(u => u.user_id === user.user_id);
                    return (
                      <tr key={user.user_id} className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <td className="p-4">
                          <button
                            onClick={() => handleSelectUser(user, !isSelected)}
                            className="flex items-center justify-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </td>
                        <td className="p-4">
                        <div>
                          <div className="font-medium">{user.email}</div>
                          <div className="text-sm text-gray-500">
                            ID: {user.user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {user.full_name || 'No name'}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <Badge variant={getStatusBadgeVariant(user.account_status)}>
                            {user.account_status}
                          </Badge>
                          {user.is_dealer && (
                            <Badge variant="outline" className="text-xs">
                              Dealer
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {user.last_sign_in_at 
                          ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                          : 'Never'
                        }
                      </td>
                      <td className="p-4">
                        <div className="text-center">
                          <div className="font-medium">{user.listings_count}</div>
                          {user.messages_count > 0 && (
                            <div className="text-xs text-gray-500">
                              {user.messages_count} messages
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePasswordReset(user)}>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewActivity(user)}>
                              <Activity className="w-4 h-4 mr-2" />
                              View Activity
                            </DropdownMenuItem>
                            {!user.email_confirmed_at && (
                              <DropdownMenuItem onClick={() => handleApproveEmail(user)} className="text-green-600">
                                <CheckSquare className="w-4 h-4 mr-2" />
                                Approve Email
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleSuspendUser(user)}
                              className={user.account_status === 'suspended' ? 'text-green-600' : 'text-orange-600'}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              {user.account_status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {(filters.page - 1) * filters.limit + 1} to{' '}
                {Math.min(filters.page * filters.limit, totalCount)} of {totalCount} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {filters.page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedUser && (
        <>
          <UserDetailsModal
            user={selectedUser}
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedUser(null);
            }}
          />
          <UserEditModal
            user={selectedUser}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSave={() => {
              loadUsers();
              setShowEditModal(false);
              setSelectedUser(null);
            }}
          />
          <PasswordResetModal
            user={selectedUser}
            isOpen={showPasswordModal}
            onClose={() => {
              setShowPasswordModal(false);
              setSelectedUser(null);
            }}
            onSuccess={() => {
              loadUsers();
            }}
          />
          <UserActivityLogsModal
            user={selectedUser}
            isOpen={showActivityModal}
            onClose={() => {
              setShowActivityModal(false);
              setSelectedUser(null);
            }}
          />
        </>
      )}


    </div>
  );
};

export default UserManagement;
