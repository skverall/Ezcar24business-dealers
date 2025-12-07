/**
 * Listings Management Component for Admin Panel
 */

import React, { useState, useEffect } from 'react';
import { Car, Search, RefreshCw, Eye, Edit, Trash2, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
import { formatDistanceToNow } from 'date-fns';
import { AdminListing } from '@/types/admin';
import { AdminApi } from '@/utils/adminApi';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const ListingsManagement: React.FC = () => {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage] = useState(1);
  const [limit] = useState(20);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
  const [editFields, setEditFields] = useState({
    title: '',
    description: '',
    price: 0,
    location: ''
  });
  const [saving, setSaving] = useState(false);
  const { user } = useAdminAuth();

  useEffect(() => {
    loadListings();
  }, [searchTerm, statusFilter, currentPage]);

  const loadListings = async () => {
    setLoading(true);
    try {
      if (import.meta.env.DEV) console.log('Loading listings with filters:', {
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: 'created_at',
        sortOrder: 'desc',
        page: currentPage,
        limit: limit
      });

      const response = await AdminApi.getListings({
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: 'created_at',
        sortOrder: 'desc',
        page: currentPage,
        limit: limit
      });

      if (import.meta.env.DEV) console.log('Listings API response:', response);

      if (response.success && response.data) {
        if (import.meta.env.DEV) console.log('Loaded listings:', response.data.length);
        setListings(response.data);
      } else {
        if (import.meta.env.DEV) console.error('Failed to load listings:', response.error);
        setListings([]);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.user_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || listing.moderation_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const handleApprove = async (listingId: string) => {
    try {
      if (!user?.id) throw new Error('No admin user');
      const response = await AdminApi.moderateListing(
        listingId,
        'approve',
        user.id
      );

      if (response.success) {
        loadListings(); // Refresh the list
      } else {
        alert(`Failed to approve listing: ${response.error}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error approving listing:', error);
      alert('Failed to approve listing');
    }
  };

  const handleReject = async (listingId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        if (!user?.id) throw new Error('No admin user');
        const response = await AdminApi.moderateListing(
          listingId,
          'reject',
          user.id,
          reason
        );

        if (response.success) {
          loadListings(); // Refresh the list
        } else {
          alert(`Failed to reject listing: ${response.error}`);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error rejecting listing:', error);
        alert('Failed to reject listing');
      }
    }
  };

  const handleViewDetails = (listing: AdminListing) => {
    // Open listing in new tab
    window.open(`/car/${listing.id}`, '_blank');
  };

  const handleEditListing = (listing: AdminListing) => {
    setSelectedListing(listing);
    setEditFields({
      title: listing.title,
      description: listing.description || '',
      price: listing.price,
      location: listing.location || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedListing || !user?.id) return;

    setSaving(true);
    try {
      const response = await AdminApi.updateListingFields(
        selectedListing.id,
        editFields,
        user.id
      );

      if (response.success) {
        setShowEditModal(false);
        loadListings(); // Refresh the list
      } else {
        alert(`Failed to update listing: ${response.error}`);
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (listingId: string) => {
    const reason = prompt('Enter deletion reason (optional):');
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        if (!user?.id) throw new Error('No admin user');
        const response = await AdminApi.deleteListing(
          listingId,
          user.id,
          reason || undefined
        );

        if (response.success) {
          loadListings(); // Refresh the list
        } else {
          alert(`Failed to delete listing: ${response.error}`);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error deleting listing:', error);
        alert('Failed to delete listing');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Listings Management</h2>
          <p className="text-gray-500 mt-1">Manage car listings, moderation queue, and sold status</p>
        </div>
        <Button onClick={loadListings} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search listings, make, model, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-800">
            <Car className="w-5 h-5 text-blue-600" />
            <span>Listings Directory <span className="text-gray-400 font-normal text-sm ml-2">({filteredListings.length} visible)</span></span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-8">
              <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 font-medium">No listings found</p>
              <p className="text-gray-500 text-sm">
                {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No listings to display'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Vehicle Details</th>
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Price Info</th>
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Owner Info</th>
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Stats</th>
                    <th className="text-left p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Created</th>
                    <th className="text-right p-4 font-semibold text-gray-600 text-sm uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((listing) => (
                    <tr key={listing.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shadow-sm border border-gray-200 overflow-hidden">
                            <Car className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{listing.title}</div>
                            <div className="text-sm text-gray-500 font-mono">
                              {listing.year} • {listing.make} {listing.model}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900">
                          AED {listing.price.toLocaleString()}
                        </div>
                        {listing.sold_price != null && (
                          <div className="text-xs text-green-600 font-medium mt-0.5">
                            Sold: AED {Number(listing.sold_price).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900">{listing.user_name}</div>
                          <div className="text-xs text-gray-500">{listing.user_email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant={getStatusBadgeVariant(listing.moderation_status)} className="shadow-sm">
                            {listing.moderation_status}
                          </Badge>
                          {listing.status && listing.status !== 'active' && (
                            <Badge
                              variant={listing.status === 'sold' ? 'destructive' : 'secondary'}
                              className="uppercase text-[10px]"
                            >
                              {listing.status}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Eye className="w-3 h-3 text-gray-400" />
                          {listing.views}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                        {listing.sold_at && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            Sold {formatDistanceToNow(new Date(listing.sold_at), { addSuffix: true })}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(listing)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditListing(listing)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Listing
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {listing.moderation_status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleApprove(listing.id)}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReject(listing.id)}
                                  className="text-orange-600"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={async () => {
                                const priceStr = prompt('Enter sold price (AED). Leave empty if unknown:');
                                if (priceStr === null) return; // cancelled
                                const soldPrice = priceStr.trim() === '' ? null : Number(priceStr);
                                if (soldPrice !== null && (isNaN(soldPrice) || soldPrice < 0)) {
                                  alert('Invalid price');
                                  return;
                                }
                                try {
                                  if (!user?.id) throw new Error('No admin user');
                                  const res = await AdminApi.markListingSold(listing.id, soldPrice, user.id);
                                  if (!res.success) {
                                    alert(res.error || 'Failed to mark as sold');
                                  } else {
                                    loadListings();
                                  }


                                } catch (e) {
                                  alert('Failed to mark as sold');
                                }
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-yellow-600" />
                              Mark as Sold
                            </DropdownMenuItem>

                            {listing.status === 'sold' && (
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    if (!user?.id) throw new Error('No admin user');
                                    const res = await AdminApi.unmarkListingSold(listing.id, user.id);
                                    if (!res.success) {
                                      alert(res.error || 'Failed to unmark sold');
                                    } else {
                                      loadListings();
                                    }
                                  } catch (e) {
                                    alert('Failed to unmark sold');
                                  }
                                }}
                              >
                                Unmark Sold
                              </DropdownMenuItem>
                            )}
                            {listing.status === 'inactive' ? (
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    if (!user?.id) throw new Error('No admin user');
                                    const res = await AdminApi.restoreListing(listing.id, user.id);
                                    if (!res.success) {
                                      alert(res.error || 'Failed to restore listing');
                                    } else {
                                      loadListings();
                                    }
                                  } catch (e) {
                                    alert('Failed to restore listing');
                                  }
                                }}
                              >
                                Restore
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (!confirm('Archive this listing? It will be hidden from browsing.')) return;
                                  try {
                                    if (!user?.id) throw new Error('No admin user');
                                    const res = await AdminApi.archiveListing(listing.id, user.id);
                                    if (!res.success) {
                                      alert(res.error || 'Failed to archive listing');
                                    } else {
                                      loadListings();
                                    }
                                  } catch (e) {
                                    alert('Failed to archive listing');
                                  }
                                }}
                              >
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(listing.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Listing Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>

          {selectedListing && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={editFields.title}
                  onChange={(e) => setEditFields(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Listing title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Price (AED)</label>
                <Input
                  type="number"
                  value={editFields.price}
                  onChange={(e) => setEditFields(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="Price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  value={editFields.location}
                  onChange={(e) => setEditFields(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  rows={4}
                  value={editFields.description}
                  onChange={(e) => setEditFields(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListingsManagement;
