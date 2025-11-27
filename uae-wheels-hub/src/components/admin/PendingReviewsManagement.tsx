/**
 * Pending Reviews Management Component for Admin Panel
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, RefreshCw, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { AdminListing } from '@/types/admin';
import { AdminApi } from '@/utils/adminApi';
import { useAdminAuth } from '@/hooks/useAdminAuth';

import { supabase } from '@/integrations/supabase/client';
const PendingReviewsManagement: React.FC = () => {
  const [pendingListings, setPendingListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [editFields, setEditFields] = useState<{ title?: string; description?: string; price?: number; location?: string }>({});
  const [images, setImages] = useState<Array<{id: string; url: string; is_cover: boolean; sort_order: number}>>([]);
  const [saving, setSaving] = useState(false);
  const { user } = useAdminAuth();

  useEffect(() => {
    loadPendingListings();
  }, [searchTerm]);

  const loadPendingListings = async () => {
    setLoading(true);
    try {
      if (import.meta.env.DEV) console.log('Loading pending listings with filters:', {
        search: searchTerm || undefined,
        status: 'pending',
        sortBy: 'created_at',
        sortOrder: 'asc',
        page: 1,
        limit: 100
      });

      const response = await AdminApi.getListings({
        search: searchTerm || undefined,
        status: 'pending', // Only get pending listings
        sortBy: 'created_at',
        sortOrder: 'asc', // Oldest first for review priority
        page: 1,
        limit: 100
      });

      if (import.meta.env.DEV) console.log('Pending listings API response:', response);

      if (response.success && response.data) {
        if (import.meta.env.DEV) console.log('Loaded pending listings:', response.data.length);
        setPendingListings(response.data);
      } else {
        if (import.meta.env.DEV) console.error('Failed to load pending listings:', response.error);
        setPendingListings([]);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading pending listings:', error);
      setPendingListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Load details & images when opening Details Modal
  useEffect(() => {
    const loadDetails = async () => {
      if (!showDetailsModal || !selectedListing) return;
      try {
        // Prefill editable fields from selected summary
        setEditFields({
          title: selectedListing.title,
          price: selectedListing.price,
        });
        // Fetch full listing for description/location if available
        try {
          const { data: full, error } = await supabase
            .from('listings')
            .select('description')
            .eq('id', selectedListing.id)
            .maybeSingle();
          
          if (!error && full) {
            setEditFields(prev => ({ 
              ...prev, 
              description: full.description || ''
            }));
          } else {
            // Fallback to empty values if query fails
            setEditFields(prev => ({ 
              ...prev, 
              description: ''
            }));
            if (import.meta.env.DEV && error) {
              console.warn('Could not fetch description:', error.message);
            }
          }
        } catch (err) {
          // Handle any unexpected errors
          setEditFields(prev => ({ 
            ...prev, 
            description: ''
          }));
          if (import.meta.env.DEV) console.warn('Error fetching listing details:', err);
        }
        // Load images
        const { data: imgs } = await supabase
          .from('listing_images')
          .select('id, url, is_cover, sort_order')
          .eq('listing_id', selectedListing.id)
          .order('is_cover', { ascending: false })
          .order('sort_order', { ascending: true });
        setImages(imgs || []);
      } catch (e) {
        if (import.meta.env.DEV) console.error('Failed to load listing details', e);
      }
    };
    loadDetails();
  }, [showDetailsModal, selectedListing]);

  const saveNote = async () => {
    if (!selectedListing || !user?.id || !noteText.trim()) return;
    setSaving(true);
    const res = await AdminApi.addListingNote(selectedListing.id, noteText.trim(), user.id);
    setSaving(false);
    if (res.success) setNoteText('');
    else alert(res.error);
  };

  const saveFields = async () => {
    if (!selectedListing || !user?.id) return;
    setSaving(true);
    const res = await AdminApi.updateListingFields(selectedListing.id, editFields, user.id);
    setSaving(false);
    if (!res.success) alert(res.error);
  };

  const setCover = async (imageId: string) => {
    if (!selectedListing || !user?.id) return;
    setSaving(true);
    const res = await AdminApi.updateListingImages(selectedListing.id, { coverImageId: imageId }, user.id);
    setSaving(false);
    if (!res.success) alert(res.error);
    else {
      setImages(prev => prev.map(img => ({ ...img, is_cover: img.id === imageId })));
    }
  };

  const reorder = async (newOrder: string[]) => {
    if (!selectedListing || !user?.id) return;
    setSaving(true);
    const res = await AdminApi.updateListingImages(selectedListing.id, { orderedIds: newOrder }, user.id);
    setSaving(false);
    if (!res.success) alert(res.error);
  };

  const sendMessage = async () => {
    if (!selectedListing || !user?.id || !messageText.trim()) return;
    setSaving(true);
    const res = await AdminApi.sendMessageToSeller(selectedListing.id, messageText.trim(), user.id);
    setSaving(false);
    if (res.success) {
      setMessageText('');
      alert('Message sent to seller successfully!');
    } else {
      alert(res.error);
    }
  };

  const filteredListings = pendingListings.filter((listing) =>
    listing.moderation_status === 'pending' && (
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getPriorityBadgeVariant = (createdAt: string) => {
    const hoursAgo = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    if (hoursAgo > 24) return 'destructive'; // High priority - over 24 hours
    if (hoursAgo > 12) return 'secondary'; // Medium priority - over 12 hours
    return 'outline'; // Low priority - under 12 hours
  };

  const getPriorityText = (createdAt: string) => {
    const hoursAgo = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    if (hoursAgo > 24) return 'high priority';
    if (hoursAgo > 12) return 'medium priority';
    return 'low priority';
  };

  const handleApprove = async (listingId: string) => {
    if (confirm('Are you sure you want to approve this listing?')) {
      try {
        if (!user?.id) throw new Error('No admin user');
        const response = await AdminApi.moderateListing(
          listingId,
          'approve',
          user.id
        );

        if (response.success) {
          loadPendingListings(); // Refresh the list
        } else {
          alert(`Failed to approve listing: ${response.error}`);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error approving listing:', error);
        alert('Failed to approve listing');
      }
    }
  };

  const handleReject = (listing: AdminListing) => {
    setSelectedListing(listing);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (selectedListing && rejectionReason.trim()) {
      try {
        if (!user?.id) throw new Error('No admin user');
        const response = await AdminApi.moderateListing(
          selectedListing.id,
          'reject',
          user.id,
          rejectionReason
        );

        if (response.success) {
          loadPendingListings(); // Refresh the list
          setShowRejectModal(false);
          setSelectedListing(null);
          setRejectionReason('');
        } else {
          alert(`Failed to reject listing: ${response.error}`);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error rejecting listing:', error);
        alert('Failed to reject listing');
      }
    }
  };

  const getWaitingTime = (createdAt: string) => {
    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Less than 1 hour';
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pending Reviews</h2>
          <p className="text-gray-600">Review and moderate pending listings</p>
        </div>
        <Button onClick={loadPendingListings} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search pending listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pending Listings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Pending Listings ({filteredListings.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Loading pending listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-gray-600 font-medium">No pending reviews!</p>
              <p className="text-gray-500 text-sm">
                All listings have been reviewed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="border rounded-lg p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{listing.title}</h3>
                        <Badge variant={getPriorityBadgeVariant(listing.created_at)}>
                          {getPriorityText(listing.created_at)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Vehicle Details</p>
                          <p className="font-medium">
                            {listing.year} {listing.make} {listing.model}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            AED {listing.price.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Seller Information</p>
                          <p className="font-medium">{listing.user_name}</p>
                          <p className="text-sm text-gray-600">{listing.user_email}</p>
                        </div>
                      </div>

                      {/* Remove description section since it's not in AdminListing type */}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Waiting: {getWaitingTime(listing.created_at)}</span>
                        </div>
                        <span>•</span>
                        <span>{listing.views} views</span>
                        <span>•</span>
                        <span>
                          Submitted {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedListing(listing); setShowDetailsModal(true); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(listing.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(listing)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      {showRejectModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Reject Listing</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting "{selectedListing.title}":
              </p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="mb-4"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedListing(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmReject}
                  disabled={!rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Reject Listing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Listing Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <label className="text-gray-500 text-xs">Title</label>
                  <Input value={editFields.title || ''} onChange={(e) => setEditFields(prev => ({ ...prev, title: e.target.value }))} />

                  <div className="text-xs text-gray-500">Vehicle</div>
                  <div className="font-medium">{selectedListing.year} {selectedListing.make} {selectedListing.model}</div>

                  <label className="text-gray-500 text-xs">Price (AED)</label>
                  <Input type="number" value={editFields.price ?? selectedListing.price} onChange={(e) => setEditFields(prev => ({ ...prev, price: Number(e.target.value) }))} />

                   <label className="text-gray-500 text-xs">Description</label>
                   <Textarea rows={4} value={editFields.description || ''} onChange={(e) => setEditFields(prev => ({ ...prev, description: e.target.value }))} />

                  <Button size="sm" onClick={saveFields} disabled={saving} className="mt-2">Save fields</Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="text-xs text-gray-500 mb-1">Images</div>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map(img => (
                      <div key={img.id} className={`relative border rounded overflow-hidden ${img.is_cover ? 'ring-2 ring-green-500' : ''}`}>
                        <img src={img.url} alt="Listing image" className="w-full h-24 object-cover" />
                        <div className="absolute top-1 right-1 flex gap-1">
                          {!img.is_cover && (
                            <Button size="sm" variant="outline" onClick={() => setCover(img.id)}>Set cover</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-gray-500 text-xs">Admin note (internal)</label>
                  <Textarea rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Write an internal note (not sent to seller)" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveNote} disabled={saving || !noteText.trim()}>Save note</Button>
                    <Button size="sm" variant="outline" onClick={() => setNoteText('')}>Clear</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-gray-500 text-xs">Message to seller</label>
                  <Textarea rows={3} value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Send a message to the listing owner..." />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={sendMessage} disabled={saving || !messageText.trim()}>Send message</Button>
                    <Button size="sm" variant="outline" onClick={() => setMessageText('')}>Clear</Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { if (selectedListing) window.open(`/car/${selectedListing.id}`, '_blank'); }}
                  >
                    Open on site
                  </Button>
                  <Button variant="outline" onClick={() => { setShowDetailsModal(false); setSelectedListing(null); }}>Close</Button>
                  {selectedListing.moderation_status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => { handleApprove(selectedListing.id); setShowDetailsModal(false); }}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => { setShowDetailsModal(false); handleReject(selectedListing); }}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingReviewsManagement;
