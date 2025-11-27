/**
 * Admin-related type definitions
 */

export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  is_dealer: boolean;
  verification_status: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  deleted_at: string | null;
  listings_count: number;
  messages_count: number;
  account_status: 'active' | 'suspended' | 'deleted' | 'unconfirmed';
  total_count: number;
}

export interface UserFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface UserDetails {
  user: {
    user_id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    location: string | null;
    is_dealer: boolean;
    verification_status: string;
    created_at: string;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    banned_until: string | null;
    account_status: string;
  };
  listings: Array<{
    id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    status: string;
    moderation_status: string;
    created_at: string;
    views: number;
  }>;
  messages: Array<{
    id: string;
    content: string;
    created_at: string;
    is_read: boolean;
    listing_title: string;
  }>;
}

export interface UserUpdateData {
  full_name?: string;
  phone?: string;
  location?: string;
  verification_status?: string;
  is_dealer?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserActivityLog {
  id: string;
  action: string;
  details: any;
  admin_username: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface BulkOperationResult {
  success_count: number;
  error_count: number;
  errors: string[];
  message: string;
}

export interface ExportData {
  export_date: string;
  total_users: number;
  users: AdminUser[];
  activity_logs?: UserActivityLog[];
}

export interface AdminListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  moderation_status: string;
  user_name: string;
  user_email: string;
  views: number;
  created_at: string;
  updated_at: string;
  // Optional sale-related fields
  sold_price?: number | null;
  sold_at?: string | null;
  total_count: number;
  description?: string;
  location?: string;
}

export interface AdminMessage {
  id: string;
  content: string;
  sender_name: string;
  sender_email: string;
  receiver_name: string;
  receiver_email: string;
  listing_title: string;
  listing_id: string;
  is_read: boolean;
  created_at: string;
  total_count: number;
}

export interface ConversationMessage {
  id: string;
  content: string;
  sender_name: string;
  sender_email?: string;
  receiver_name?: string;
  receiver_email?: string;
  listing_id?: string;
  listing_title?: string;
  is_read: boolean;
  created_at: string;
}

