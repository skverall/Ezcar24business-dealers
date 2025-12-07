import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, X, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  listing: {
    title: string | null;
    price: number | null;
    make: string | null;
    model: string | null;
  };
  other_user: {
    full_name: string | null;
  };
  unread_count: number;
}

interface ChatSystemProps {
  listingId?: string;
  sellerId?: string;
  className?: string;
}

export default function ChatSystem({ listingId, sellerId, className }: ChatSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [_showMessages, setShowMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open to prevent background scrolling and layout shift
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations when chat opens
  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
    }
  }, [isOpen, user]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Real-time message updates
  useEffect(() => {
    if (!user || !selectedConversation) return;

    const [listingId] = selectedConversation.split('|');
    
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
            // Check if message already exists to prevent duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
          
          // Mark as read if it's for current user
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
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, selectedConversation]);

  // Real-time conversation updates
  useEffect(() => {
    if (!user) return;

    const conversationsChannel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `or(buyer_id.eq.${user.id},seller_id.eq.${user.id})`
        },
        () => {
          // Reload conversations when any conversation is updated
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `or(buyer_id.eq.${user.id},seller_id.eq.${user.id})`
        },
        () => {
          // Reload conversations when a new conversation is created
          loadConversations();
        }
      )
      .subscribe();

    // Subscribe to ALL new messages for this user (global notifications)
    const globalMessagesChannel = supabase
      .channel('global-messages-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          console.log('New message received in ChatSystem:', newMessage);

          // Update conversations immediately without full reload for better performance
          setConversations(prev => prev.map(conv => {
            // Check if this message belongs to this conversation
            const isThisConversation = conv.listing_id === newMessage.listing_id &&
              ((conv.buyer_id === newMessage.sender_id && conv.seller_id === newMessage.receiver_id) ||
               (conv.buyer_id === newMessage.receiver_id && conv.seller_id === newMessage.sender_id));

            if (isThisConversation) {
              return {
                ...conv,
                unread_count: conv.unread_count + 1,
                last_message_at: newMessage.created_at
              };
            }
            return conv;
          }));

          // Also do a full refresh to ensure accuracy
          setTimeout(() => loadConversations(), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(globalMessagesChannel);
    };
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        toast({ title: 'Failed to load conversations', description: error.message, variant: 'destructive' });
        return;
      }

      // Get additional data for each conversation
    const conversationsWithUsers = await Promise.all(
      (data || []).map(async (conv) => {
        if (!user) return null;
        const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
          
          // Get other user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', otherUserId)
            .single();

          // Get listing details
          const { data: listing } = await supabase
            .from('listings')
            .select('title, price, make, model')
            .eq('id', conv.listing_id)
            .single();

          // Check if conversation has any messages
          const { data: allMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('listing_id', conv.listing_id)
            .or(`and(sender_id.eq.${conv.buyer_id},receiver_id.eq.${conv.seller_id}),and(sender_id.eq.${conv.seller_id},receiver_id.eq.${conv.buyer_id})`);

          // Skip conversations with no messages
          if (!allMessages || allMessages.length === 0) {
            return null;
          }

          // Get unread message count
          const { data: messages } = await supabase
            .from('messages')
            .select('id, is_read, receiver_id')
            .eq('listing_id', conv.listing_id)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

          return {
            ...conv,
            listing: listing || { title: 'Unknown Listing', price: 0, make: '', model: '' },
            other_user: profile || { full_name: 'Unknown User' },
            unread_count: messages?.length || 0
          };
        })
      );

      // Filter out null conversations (those without messages)
      const validConversations = conversationsWithUsers.filter((conv): conv is Conversation => conv !== null);
      setConversations(validConversations);
    } catch (err: any) {
      toast({ title: 'Failed to load conversations', description: err.message, variant: 'destructive' });
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!conversationId) return;
    const [listingId, buyerId, sellerId] = conversationId.split('|');
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listingId)
      .or(`and(sender_id.eq.${buyerId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${buyerId})`)
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: 'Failed to load messages', description: error.message, variant: 'destructive' });
      return;
    }

    setMessages(data || []);
    
    // Mark messages as read
    const unreadMessages = data?.filter(msg => msg.receiver_id === user?.id && !msg.is_read) || [];
    if (unreadMessages.length > 0) {
      for (const msg of unreadMessages) {
        await markAsRead(msg.id);
      }
      // Refresh conversations to update unread counts
      await loadConversations();
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', user?.id);
  };

  const startConversation = async () => {
    if (!user || !listingId || !sellerId) return;

    setLoading(true);
    try {
      // Create or get existing conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('listing_id', listingId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('conversations')
          .insert({
            listing_id: listingId,
            buyer_id: user.id,
            seller_id: sellerId
          });

        if (error) {
          toast({ title: 'Failed to start conversation', description: error.message, variant: 'destructive' });
          return;
        }
      }

      setSelectedConversation(`${listingId}|${user.id}|${sellerId}`);
      setIsOpen(true);
      await loadConversations();
      
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    // Validate message content length and content
    if (newMessage.trim().length > 2000) {
      toast({ 
        title: 'Message too long', 
        description: 'Messages must be 2000 characters or less', 
        variant: 'destructive' 
      });
      return;
    }

    const [listingId, buyerId, sellerId] = selectedConversation.split('|');
    const receiverId = buyerId === user.id ? sellerId : buyerId;

    // Sanitize message content
    const sanitizedContent = newMessage
      .trim()
      .replace(/[<>]/g, '') // Remove potentially dangerous HTML characters
      .substring(0, 2000); // Enforce length limit

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          listing_id: listingId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: sanitizedContent
        });

      if (error) {
        // Check if it's a rate limiting error
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          toast({ 
            title: 'Slow down', 
            description: 'Please wait before sending another message', 
            variant: 'destructive' 
          });
        } else {
          toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
        }
        return;
      }

      setNewMessage('');
      
      // Log activity
      try {
        await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_action: 'send_message',
          p_details: { listing_id: listingId, message_length: sanitizedContent.length }
        });
      } catch (logError) {
        // Don't fail the message send if logging fails
        console.warn('Failed to log activity:', logError);
      }

    } catch (error: any) {
      console.error('Send message error:', error);
      toast({ title: 'Failed to send message', description: 'Please try again', variant: 'destructive' });
    }
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  if (listingId && sellerId && user?.id !== sellerId) {
    return (
      <Button 
        onClick={startConversation} 
        disabled={loading}
        className={cn("gap-2", className)}
      >
        <MessageCircle className="w-4 h-4" />
        {loading ? "Starting..." : "Message Seller"}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn("relative gap-2", className)}
      >
        <MessageCircle className="w-4 h-4" />
        Messages
        {totalUnread > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs font-bold flex items-center justify-center min-w-[20px] shadow-lg border-2 border-background animate-pulse bg-gradient-to-r from-red-500 to-red-600"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-8 pb-8">
          <Card className="w-full max-w-5xl h-[80vh] max-h-[700px] min-h-[500px] flex flex-col shadow-card border-border/50 bg-[hsl(var(--panel))] my-auto">
            <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-b border-border/20 bg-gradient-to-r from-background to-muted/40 shadow-sm shrink-0 rounded-t-xl border-t-2 border-t-[hsl(var(--luxury)/0.25)]">
              <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-luxury" />
                Messages
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setShowMessages(false);
                  setSelectedConversation(null);
                }}
                className="h-9 w-9 p-0 hover:bg-luxury/10 hover:text-luxury rounded-full transition-all duration-200"
                title="Close Messages"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            
            <CardContent className="flex-1 flex overflow-hidden p-0 flex-col md:flex-row">
              {/* Conversations List */}
              <div className={cn(
                "md:w-80 md:min-w-[320px] w-full min-w-0 border-border/20 bg-muted/30 flex flex-col border-b md:border-b-0 md:border-r",
                "flex"
              )}>
                <div className="p-6 border-b border-border/20 bg-background/30 shrink-0">
                  <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">Conversations</h3>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    {conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-luxury/20 to-luxury/5 flex items-center justify-center mb-6 shadow-lg border border-luxury/10">
                          <MessageCircle className="w-12 h-12 text-luxury" />
                        </div>
                        <h3 className="font-semibold text-xl text-foreground mb-3">Start Your First Conversation</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mb-6">
                          Connect with car sellers and buyers to discuss listings, negotiate prices, and arrange viewings.
                        </p>
                        <Button
                          variant="luxury"
                          onClick={() => { setIsOpen(false); navigate('/browse'); }}
                        >
                          Explore Cars
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {conversations.map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => {
                              setSelectedConversation(`${conv.listing_id}|${conv.buyer_id}|${conv.seller_id}`);
                              setShowMessages(true);
                            }}
                            className={cn(
                              "p-4 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-luxury/20 hover:bg-luxury/5 hover:shadow-sm",
                              selectedConversation === `${conv.listing_id}-${conv.buyer_id}-${conv.seller_id}` && "bg-luxury/10 border-luxury/30 shadow-sm"
                            )}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-sm text-foreground pr-2">{conv.other_user.full_name}</h4>
                              {conv.unread_count > 0 && (
                                <Badge className="h-5 w-5 rounded-full p-0 text-xs bg-gradient-to-r from-luxury to-luxury/80 text-luxury-foreground flex-shrink-0 font-bold flex items-center justify-center min-w-[20px] shadow-lg border border-luxury-foreground/20 animate-pulse">
                                  {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground/80 font-medium mb-2 truncate">
                              {conv.listing.make} {conv.listing.model}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(conv.last_message_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Messages */}
              <div className={cn(
                "flex-1 flex flex-col min-w-0 w-full"
              )}>
                {selectedConversation ? (
                  <>
                    {/* Mobile back button */}
                    <div className="md:hidden flex items-center p-6 border-b border-border/20 bg-background/50 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMessages(false)}
                        className="mr-3 h-8 w-8 p-0"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <h3 className="font-semibold text-foreground truncate">
                        {conversations.find(c => `${c.listing_id}-${c.buyer_id}-${c.seller_id}` === selectedConversation)?.other_user.full_name}
                      </h3>
                    </div>
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-4">
                         {messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-luxury/20 to-luxury/5 flex items-center justify-center mb-6 shadow-lg border border-luxury/10">
                              <MessageCircle className="w-10 h-10 text-luxury" />
                            </div>
                            <h3 className="font-semibold text-xl text-foreground mb-3">Start the Conversation</h3>
                            <p className="text-sm text-muted-foreground max-w-[320px] leading-relaxed">
                              Send your first message to begin discussing this car listing. Ask questions about the vehicle, schedule a viewing, or negotiate the price.
                            </p>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "flex mb-4",
                                message.sender_id === user?.id ? "justify-end" : "justify-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[75%] p-4 rounded-2xl shadow-md border",
                                  message.sender_id === user?.id
                                    ? "bg-luxury text-luxury-foreground border-luxury/20 rounded-br-md"
                                    : "bg-background border-border/30 rounded-bl-md"
                                )}
                              >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                                <p className="text-xs opacity-70 mt-2 font-medium">
                                  {new Date(message.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                    
                    <Separator />

                    <div className="p-6 bg-background border-t border-border/20 shrink-0">
                      <div className="flex gap-3">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                          className="flex-1 h-12 px-4 border-border/30 focus:border-luxury/50 focus:ring-luxury/20"
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="h-12 px-6 bg-luxury hover:bg-luxury/90 text-luxury-foreground rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-sm">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-luxury/20 to-luxury/5 flex items-center justify-center mx-auto mb-6 shadow-lg border border-luxury/10">
                        <MessageCircle className="w-12 h-12 text-luxury" />
                      </div>
                      <h3 className="font-semibold text-xl text-foreground mb-4">Select a Conversation</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        Choose a conversation from the left panel to view messages and continue your discussion about car listings.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
