import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logUUIDValidation } from '@/utils/uuid';

// Request notification permission on load
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// Show browser notification for new message
const showNotification = (senderName: string, message: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`New message from ${senderName}`, {
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      icon: '/favicon.ico',
      tag: 'new-message',
      requireInteraction: true // Keep notification visible until user interacts
    });
  }

  // Play notification sound on mobile devices
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
};

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  listing?: {
    title: string;
    price: number;
    make: string;
    model: string;
  };
  other_user?: {
    full_name: string;
    avatar_url?: string;
  };
  unread_count: number;
  latest_message?: string;
}

interface ConversationWithTyping extends Conversation {
  typing_users: string[];
}

export const useRealtimeChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithTyping[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);

  // Load conversations with enhanced data (optimized via RPC)
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingConversations(true);
      const { data, error } = await (supabase as any).rpc('get_user_conversations', {
        p_user_id: user.id,
        p_limit: 50,
        p_offset: 0,
      });

      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        listing_id: row.listing_id,
        buyer_id: row.buyer_id,
        seller_id: row.seller_id,
        last_message_at: row.last_message_at,
        listing: {
          title: row.listing_title,
          price: row.listing_price,
          make: row.listing_make,
          model: row.listing_model,
        },
        other_user: {
          full_name: row.other_full_name,
          avatar_url: row.other_avatar_url,
        },
        unread_count: row.unread_count,
        latest_message: row.latest_message,
        typing_users: [],
      }));

      setConversations(mapped);
    } catch (err: any) {
      toast({
        title: 'Failed to load conversations',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user, toast]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    const [listingId, buyerId, sellerId] = conversationId.split('|');

    // Validate UUIDs
    if (!logUUIDValidation('loadMessages', { listingId, buyerId, sellerId })) {
      toast({
        title: 'Failed to load messages',
        description: `Invalid UUID format: listingId=${listingId}, buyerId=${buyerId}, sellerId=${sellerId}`,
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('listing_id', listingId)
        .or(`and(sender_id.eq.${buyerId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${buyerId})`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const initial = (data || []) as Message[];
      setMessages(initial.reverse());
      setHasMoreMessages(initial.length === 100);
      setOldestCursor(initial.length ? initial[0].created_at : null);

      // Mark messages as read
      const unreadMessages = data?.filter(msg => msg.receiver_id === user?.id && !msg.is_read) || [];
      if (unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          await markAsRead(msg.id);
        }
        // Refresh conversations to update unread counts
        await loadConversations();
      }
    } catch (err: any) {
      toast({
        title: 'Failed to load messages',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user, toast]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', user.id);
  }, [user]);

  // Send message
  const sendMessage = useCallback(async (content: string, conversationId: string) => {
    if (!content.trim() || !user) return false;

    const [listingId, buyerId, sellerId] = conversationId.split('|');

    // Validate UUIDs
    if (!logUUIDValidation('sendMessage', { listingId, buyerId, sellerId })) {
      toast({
        title: 'Failed to send message',
        description: `Invalid UUID format: listingId=${listingId}, buyerId=${buyerId}, sellerId=${sellerId}`,
        variant: 'destructive'
      });
      return false;
    }

    const receiverId = buyerId === user.id ? sellerId : buyerId;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          listing_id: listingId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim()
        });

      if (error) throw error;
      return true;
    } catch (err: any) {
      toast({
        title: 'Failed to send message',
        description: err.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [user, toast]);
  // Load older messages (lazy pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!selectedConversation || !hasMoreMessages || !oldestCursor) return;
    const [listingId, buyerId, sellerId] = selectedConversation.split('|');
    try {
      setIsLoadingMore(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('listing_id', listingId)
        .or(`and(sender_id.eq.${buyerId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${buyerId})`)
        .lt('created_at', oldestCursor)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const older = (data || []) as Message[];
      if (older.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      // prepend older messages keeping order ascending in state
      setMessages(prev => [...older.reverse(), ...prev]);
      setOldestCursor(older.length ? older[older.length - 1].created_at : oldestCursor);
      setHasMoreMessages(older.length === 100);
    } catch (err) {
      // Silent fail
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedConversation, hasMoreMessages, oldestCursor]);


  // Handle typing indicator
  const handleTyping = useCallback((conversationId: string, typing: boolean) => {
    if (!user) return;

    const [listingId] = conversationId.split('|');
    const channel = supabase.channel(`typing-${listingId}`);

    if (typing) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id, typing: true }
      });
      setIsTyping(true);
    } else {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id, typing: false }
      });
      setIsTyping(false);
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    loadConversations();

    // Request notification permission
    requestNotificationPermission();

    // Subscribe to conversation updates
    const conversationsChannel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `or(buyer_id.eq.${user.id},seller_id.eq.${user.id})`
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    // Subscribe to ALL new messages for this user (global notifications)
    const globalMessagesChannel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          console.log('New message received:', newMessage);

          // Update conversations immediately without full reload for better performance
          setConversations(prev => {
            const updatedConversations = prev.map(conv => {
              // Check if this message belongs to this conversation
              const isThisConversation = conv.listing_id === newMessage.listing_id &&
                ((conv.buyer_id === newMessage.sender_id && conv.seller_id === newMessage.receiver_id) ||
                 (conv.buyer_id === newMessage.receiver_id && conv.seller_id === newMessage.sender_id));

              if (isThisConversation) {
                // Show browser notification
                const senderName = conv.other_user?.full_name || 'Someone';
                showNotification(senderName, newMessage.content);

                return {
                  ...conv,
                  unread_count: conv.unread_count + 1,
                  last_message_at: newMessage.created_at,
                  latest_message: newMessage.content
                };
              }
              return conv;
            });

            return updatedConversations;
          });

          // Also do a full refresh to ensure accuracy
          setTimeout(() => loadConversations(), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(globalMessagesChannel);
    };
  }, [user, loadConversations]);

  // Set up message real-time subscriptions when conversation is selected
  useEffect(() => {
    if (!user || !selectedConversation) return;

    const [listingId] = selectedConversation.split('|');

    // Load messages
    loadMessages(selectedConversation);

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listingId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });

          if (newMessage.receiver_id === user.id) {
            markAsRead(newMessage.id);
          }

          // Refresh conversations to update unread counts
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listingId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => prev.map(msg =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));


        }
      )
      // Subscribe to typing indicators
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, typing } = payload.payload;
        if (user_id !== user.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (typing) {
              newSet.add(user_id);
            } else {
              newSet.delete(user_id);
            }
            return newSet;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, selectedConversation, loadMessages, markAsRead]);

  return {
    conversations,
    messages,
    selectedConversation,
    setSelectedConversation,
    sendMessage,
    handleTyping,
    isTyping,
    typingUsers,
    loadConversations,
    loadMessages,
    loadOlderMessages,
    isLoadingConversations,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
  };
};