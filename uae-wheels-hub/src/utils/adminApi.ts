/**
 * Admin API utilities for user management
 */

import { supabase } from '@/integrations/supabase/client';
import { AdminAuth } from '@/utils/adminAuth';
import { AdminUser, UserFilters, UserDetails, UserUpdateData, ApiResponse, ConversationMessage } from '@/types/admin';
import { getPasswordResetUrl } from './urlConfig';

export class AdminApi {
  /**
   * Get users with filtering, sorting, and pagination
   */
  static async getUsers(filters: UserFilters): Promise<ApiResponse<AdminUser[]>> {
    try {
      const { data, error } = await (supabase as any).rpc('get_users_for_admin', {
        p_limit: filters.limit,
        p_offset: (filters.page - 1) * filters.limit,
        p_search: filters.search || null,
        p_status_filter: filters.status || null,
        p_sort_by: filters.sortBy,
        p_sort_order: filters.sortOrder
      });

      if (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: 'Failed to fetch users' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get detailed user information
   */
  static async getUserDetails(userId: string): Promise<ApiResponse<UserDetails>> {
    try {
      const { data, error } = await (supabase as any).rpc('admin_get_user_details', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching user details:', error);
        return { success: false, error: 'Failed to fetch user details' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user details:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Update user profile with activity logging
   */
  static async updateUserProfile(
    userId: string,
    updateData: UserUpdateData,
    adminUserId?: string
  ): Promise<ApiResponse> {
    try {
      const { data, error } = await (supabase as any).rpc('admin_update_user_profile_with_log', {
        p_user_id: userId,
        p_admin_user_id: adminUserId || null,
        p_full_name: updateData.full_name || null,
        p_phone: updateData.phone || null,
        p_location: updateData.location || null,
        p_verification_status: updateData.verification_status || null,
        p_is_dealer: updateData.is_dealer !== undefined ? updateData.is_dealer : null
      });

      if (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: 'Failed to update user profile' };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return { success: true, message: data.message, data: data.changes };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Suspend or unsuspend user with activity logging
   */
  static async suspendUser(
    userId: string,
    suspend: boolean,
    durationHours: number = 24,
    reason?: string,
    adminUserId?: string
  ): Promise<ApiResponse> {
    try {
      const { data, error } = await (supabase as any).rpc('admin_suspend_user_with_log', {
        p_user_id: userId,
        p_admin_user_id: adminUserId || null,
        p_suspend: suspend,
        p_duration_hours: durationHours,
        p_reason: reason || null
      });

      if (error) {
        console.error('Error suspending user:', error);
        return { success: false, error: 'Failed to update user status' };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error suspending user:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Approve (confirm) user email by admin via Edge Function
   */
  static async approveUserEmail(userId: string): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).functions.invoke('admin-approve-email', {
        body: { userId, sessionToken },
      });
      if (error) return { success: false, error: 'Failed to approve email' };
      if (data && data.error) return { success: false, error: data.error };
      return { success: true, message: 'Email approved successfully' };
    } catch (e) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Reset user password using Supabase Admin API
   */
  static async resetUserPassword(userId: string, newPassword: string): Promise<ApiResponse> {
    try {
      // Use Supabase Admin API to update user password
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        console.error('Error resetting password:', error);
        return { success: false, error: 'Failed to reset password' };
      }

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string): Promise<ApiResponse> {
    try {
      const redirectUrl = getPasswordResetUrl();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Error sending password reset email:', error);
        return { success: false, error: 'Failed to send password reset email' };
      }

      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Delete user account securely via RPC function
   */
  static async deleteUser(userId: string): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_delete_user', {
        p_user_id: userId,
        p_session_token: sessionToken
      });

      if (error) {
        console.error('Error deleting user (RPC):', error);
        return { success: false, error: error.message || 'Failed to delete user' };
      }

      if (data && !data.success) {
        return { success: false, error: data.error || 'Failed to delete user' };
      }

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get user activity logs
   */
  static async getUserActivityLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse> {
    try {
      const { data, error } = await (supabase as any).rpc('get_user_activity_logs', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('Error fetching activity logs:', error);
        return { success: false, error: 'Failed to fetch activity logs' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Bulk suspend/unsuspend users
   */
  static async bulkSuspendUsers(
    userIds: string[],
    suspend: boolean,
    adminUserId: string,
    durationHours: number = 24,
    reason?: string
  ): Promise<ApiResponse> {
    try {
      const { data, error } = await (supabase as any).rpc('admin_bulk_suspend_users', {
        p_user_ids: userIds,
        p_admin_user_id: adminUserId,
        p_suspend: suspend,
        p_duration_hours: durationHours,
        p_reason: reason || null
      });

      if (error) {
        console.error('Error bulk suspending users:', error);
        return { success: false, error: 'Failed to bulk suspend users' };
      }

      return { success: true, message: data.message, data };
    } catch (error) {
      console.error('Error bulk suspending users:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Bulk update verification status
   */
  static async bulkUpdateVerification(
    userIds: string[],
    verificationStatus: string,
    adminUserId: string,
    reason?: string
  ): Promise<ApiResponse> {
    try {
      const { data, error } = await (supabase as any).rpc('admin_bulk_update_verification', {
        p_user_ids: userIds,
        p_admin_user_id: adminUserId,
        p_verification_status: verificationStatus,
        p_reason: reason || null
      });

      if (error) {
        console.error('Error bulk updating verification:', error);
        return { success: false, error: 'Failed to bulk update verification' };
      }

      return { success: true, message: data.message, data };
    } catch (error) {
      console.error('Error bulk updating verification:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Export users data
   */
  static async exportUsersData(
    userIds?: string[],
    includeActivityLogs: boolean = false
  ): Promise<ApiResponse> {
    try {
      const { data, error } = await (supabase as any).rpc('admin_export_users_data', {
        p_user_ids: userIds || null,
        p_include_activity_logs: includeActivityLogs
      });

      if (error) {
        console.error('Error exporting users data:', error);
        return { success: false, error: 'Failed to export users data' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error exporting users data:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Bulk delete users (admin only)
   * Note: Requires service role on the Supabase client. Each deletion is attempted individually.
   */
  static async bulkDeleteUsers(userIds: string[]): Promise<ApiResponse> {
    try {
      let success_count = 0;
      let error_count = 0;
      const errors: string[] = [];

      for (const id of userIds) {
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error) {
          error_count += 1;
          errors.push(`${id}: ${error.message || 'Failed to delete user'}`);
        } else {
          success_count += 1;
        }
      }

      return {
        success: error_count === 0,
        message: `Deleted ${success_count} users, failed ${error_count}`,
        data: { success_count, error_count, errors, message: `Deleted ${success_count} users, failed ${error_count}` }
      };
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get listings with filtering, sorting, and pagination
   */
  static async getListings(filters: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    try {
      const params = {
        p_limit: filters.limit || 50,
        p_offset: ((filters.page || 1) - 1) * (filters.limit || 50),
        p_search: filters.search || null,
        p_status_filter: filters.status || null,
        p_sort_by: filters.sortBy || 'created_at',
        p_sort_order: filters.sortOrder || 'desc'
      };

      if (import.meta.env.DEV) console.log('AdminApi.getListings calling RPC with params:', params);

      const { data, error } = await (supabase as any).rpc('get_listings_for_admin', params);

      if (import.meta.env.DEV) console.log('AdminApi.getListings RPC response:', { data, error });

      if (error) {
        console.error('Error fetching listings:', error);
        return { success: false, error: 'Failed to fetch listings' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching listings:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get messages with filtering and pagination
   */
  static async getMessages(filters: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    try {
      const { data, error } = await (supabase as any).rpc('get_messages_for_admin', {
        p_limit: filters.limit || 50,
        p_offset: ((filters.page || 1) - 1) * (filters.limit || 50),
        p_search: filters.search || null
      });

      if (error) {
        console.error('Error fetching messages:', error);
        return { success: false, error: 'Failed to fetch messages' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Get conversation by a message id (context thread)
   */
  static async getConversationByMessage(
    messageId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<ConversationMessage[]>> {
    try {
      const { data, error } = await (supabase as any).rpc('admin_get_conversation_by_message', {
        p_message_id: messageId,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error fetching conversation:', error);
        return { success: false, error: 'Failed to fetch conversation' };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Mark message read/unread
   */
  static async markMessageRead(
    messageId: string,
    isRead: boolean,
    adminUserId: string
  ): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_mark_message_read', {
        p_message_id: messageId,
        p_is_read: isRead,
        p_admin_user_id: adminUserId,
        p_session_token: sessionToken || null,
      });

      if (error) {
        console.error('Error marking message read:', error);
        return { success: false, error: 'Failed to update message read state' };
      }

      if (data && data.success === false) {
        return { success: false, error: data.error || 'Failed to update message read state' };
      }

      return { success: true, message: data?.message || 'Updated' };
    } catch (error) {
      console.error('Error marking message read:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(
    messageId: string,
    adminUserId: string
  ): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_delete_message', {
        p_message_id: messageId,
        p_admin_user_id: adminUserId,
        p_session_token: sessionToken || null,
      });

      if (error) {
        console.error('Error deleting message:', error);
        return { success: false, error: 'Failed to delete message' };
      }

      if (data && data.success === false) {
        return { success: false, error: data.error || 'Failed to delete message' };
      }

      return { success: true, message: data?.message || 'Message deleted' };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }


  /**
   * Moderate listing (approve/reject)
   */
  static async moderateListing(
    listingId: string,
    action: 'approve' | 'reject',
    adminUserId: string,
    reason?: string
  ): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_moderate_listing', {
        p_listing_id: listingId,
        p_admin_user_id: adminUserId,
        p_action: action,
        p_reason: reason || null,
        p_session_token: sessionToken || null
      });

      if (error) {
        console.error('Error moderating listing:', error);
        return { success: false, error: 'Failed to moderate listing' };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error moderating listing:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Delete listing
   */
  static async deleteListing(
    listingId: string,
    adminUserId: string,
    reason?: string
  ): Promise<ApiResponse> {
    try {
      const { error } = await (supabase as any).rpc('admin_delete_listing', {
        p_listing_id: listingId,
        p_admin_user_id: adminUserId,
        p_reason: reason || null
      });

      if (error) {
        console.error('Error deleting listing:', error);
        return { success: false, error: 'Failed to delete listing' };
      }

      return { success: true, message: 'Listing deleted successfully' };
    } catch (error) {
      console.error('Error deleting listing:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Mark listing as sold (optional sold price)
   */
  static async markListingSold(
    listingId: string,
    soldPrice: number | null,
    adminUserId: string
  ): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_mark_listing_sold', {
        p_listing_id: listingId,
        p_admin_user_id: adminUserId,
        p_sold_price: soldPrice ?? null,
        p_session_token: sessionToken || null,
      });
      if (error) return { success: false, error: 'Failed to mark as sold' };
      if (data && data.success === false) return { success: false, error: data.error };
      return { success: true, message: data?.message || 'Listing marked as sold' };
    } catch (e) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Archive listing (set status to inactive)
   */
  static async archiveListing(
    listingId: string,
    adminUserId: string
  ): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_archive_listing', {
        p_listing_id: listingId,
        p_admin_user_id: adminUserId,
        p_session_token: sessionToken || null,
      });
      if (error) return { success: false, error: 'Failed to archive listing' };
      if (data && data.success === false) return { success: false, error: data.error };
      return { success: true, message: data?.message || 'Listing archived' };
    } catch (e) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Restore listing (set status to active)
   */
  static async restoreListing(
    listingId: string,
    adminUserId: string
  ): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_restore_listing', {
        p_listing_id: listingId,
        p_admin_user_id: adminUserId,
        p_session_token: sessionToken || null,
      });
      if (error) return { success: false, error: 'Failed to restore listing' };
      if (data && data.success === false) return { success: false, error: data.error };
      return { success: true, message: data?.message || 'Listing restored' };
    } catch (e) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Unmark listing as sold (clear sold fields and set active)
   */
  static async unmarkListingSold(
    listingId: string,
    adminUserId: string
  ): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_unmark_listing_sold', {
        p_listing_id: listingId,
        p_admin_user_id: adminUserId,
        p_session_token: sessionToken || null,
      });
      if (error) return { success: false, error: 'Failed to unmark sold' };
      if (data && data.success === false) return { success: false, error: data.error };
      return { success: true, message: data?.message || 'Listing sale reverted' };
    } catch (e) {
      return { success: false, error: 'Network error occurred' };
    }
  }


  /**
   * Admin: add listing note
   */
  static async addListingNote(listingId: string, note: string, adminUserId: string): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_add_listing_note', {
        p_listing_id: listingId,
        p_admin_user_id: adminUserId,
        p_note_text: note,
        p_session_token: sessionToken || null,
      });
      if (error) return { success: false, error: 'Failed to add note' };
      if (data && data.success === false) return { success: false, error: data.error };
      return { success: true, message: 'Note saved' };
    } catch (e) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Admin: update listing fields
   */
  static async updateListingFields(listingId: string, fields: { title?: string; description?: string; price?: number; location?: string }, adminUserId: string): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_update_listing_fields', {
        p_listing_id: listingId,
        p_admin_user_id: adminUserId,
        p_title: fields.title ?? null,
        p_description: fields.description ?? null,
        p_price: fields.price ?? null,
        p_location: fields.location ?? null,
        p_session_token: sessionToken || null,
      });
      if (error) return { success: false, error: 'Failed to update listing' };
      if (data && data.success === false) return { success: false, error: data.error };
      return { success: true, message: 'Listing updated' };
    } catch (e) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Admin: update images order/cover
   */
  static async updateListingImages(listingId: string, params: { coverImageId?: string; orderedIds?: string[] }, adminUserId: string): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_update_listing_images', {
        p_listing_id: listingId,
        p_admin_user_id: adminUserId,
        p_cover_image_id: params.coverImageId ?? null,
        p_ordered_ids: params.orderedIds ?? null,
        p_session_token: sessionToken || null,
      });
      if (error) return { success: false, error: 'Failed to update images' };
      if (data && data.success === false) return { success: false, error: data.error };
      return { success: true, message: 'Images updated' };
    } catch (e) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Admin: send message to listing seller
   */
  static async sendMessageToSeller(listingId: string, messageContent: string, adminUserId: string): Promise<ApiResponse> {
    try {
      const sessionToken = AdminAuth.getSessionTokenValue();
      const { data, error } = await (supabase as any).rpc('admin_send_message_to_seller', {
        p_listing_id: listingId,
        p_admin_user_id: adminUserId,
        p_message_content: messageContent,
        p_session_token: sessionToken || null,
      });
      if (error) return { success: false, error: 'Failed to send message' };
      if (data && data.success === false) return { success: false, error: data.error };
      return { success: true, message: 'Message sent to seller' };
    } catch (e) {
      return { success: false, error: 'Network error occurred' };
    }
  }
}

