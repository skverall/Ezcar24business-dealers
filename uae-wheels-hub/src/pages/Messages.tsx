import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MessageCircle, Send, User, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatMake, formatModel, formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { logUUIDValidation } from '@/utils/uuid';
import { ConversationListSkeleton, MessageListSkeleton } from '@/components/ChatSkeleton';
import MessageMenu from '@/components/MessageMenu';

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const listingId = params.get('listingId');
  const sellerId = params.get('sellerId');



  const {
    conversations,
    messages,
    selectedConversation,
    setSelectedConversation,
    sendMessage,
    isLoadingConversations,
    isLoadingMessages,
    isLoadingMore,
    hasMoreMessages,
    loadOlderMessages,
    handleTyping,
    typingUsers,
    loadConversations,
    loadMessages,
  } = useRealtimeChat();

  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = useMemo(() => (
    conversations.find(c => `${c.listing_id}|${c.buyer_id}|${c.seller_id}` === selectedConversation)
  ), [conversations, selectedConversation]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate(`/auth?tab=login&redirect=/messages${listingId && sellerId ? `?listingId=${listingId}&sellerId=${sellerId}` : ''}`);
    }
  }, [user, navigate, listingId, sellerId]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    // If opened from a listing, ensure conversation exists and preselect
    const ensureConversation = async () => {
      if (!user || !listingId || !sellerId) return;
      if (user.id === sellerId) return; // Don't start with self

      // Validate UUIDs
      if (!logUUIDValidation('Messages ensureConversation', { listingId, sellerId })) {
        toast({
          title: 'Invalid parameters',
          description: `Invalid UUID format: listingId=${listingId}, sellerId=${sellerId}`,
          variant: 'destructive'
        });
        return;
      }

      setLoading(true);
      try {
        const { data: existing } = await supabase
          .from('conversations')
          .select('*')
          .eq('listing_id', listingId)
          .eq('buyer_id', user.id)
          .eq('seller_id', sellerId)
          .maybeSingle();

        if (!existing) {
          const { error } = await supabase.from('conversations').insert({
            listing_id: listingId,
            buyer_id: user.id,
            seller_id: sellerId,
          });
          if (error) throw error;
        }
        setSelectedConversation(`${listingId}|${user.id}|${sellerId}`);
        await loadConversations();
        setShowMessages(true);
      } catch (err: any) {
        toast({ title: 'Failed to start conversation', description: err?.message ?? 'Unknown error', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    ensureConversation();
  }, [user, listingId, sellerId, setSelectedConversation, loadConversations, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showTypingIndicator = typingUsers.size > 0;

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    const ok = await sendMessage(newMessage, selectedConversation);
    if (ok) {
      setNewMessage('');
      handleTyping(selectedConversation, false);
    }
  };

  return (
    <div className="min-h-screen bg-background w-full max-w-[100vw] overflow-x-hidden">
      <Header />

      <main className="container mx-auto px-4 py-4 md:py-6">
        <Card className="w-full h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] max-h-[100vh] flex flex-col shadow-2xl border-border/50 bg-background/95 backdrop-blur rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-4 md:px-6 border-b border-border/20 bg-gradient-to-r from-background to-muted/20 shrink-0">
            <CardTitle className="text-lg md:text-xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-luxury/20 to-luxury/5 flex items-center justify-center border border-luxury/20">
                <MessageCircle className="w-5 h-5 text-luxury" />
              </div>
              {selectedConv ? (
                <div className="flex items-center gap-3 min-w-0">
                  <span className="hidden md:block">Messages with</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={getProxiedImageUrl(selectedConv.other_user?.avatar_url || '')} />
                      <AvatarFallback className="bg-luxury/10 text-luxury">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate max-w-[40vw] md:max-w-none">{selectedConv.other_user?.full_name}</span>
                  </div>
                </div>
              ) : (
                'Messages'
              )}
            </CardTitle>
            <div className="hidden md:flex items-center gap-2">
              {/* Removed phone and video call buttons as they are not supported */}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex overflow-hidden p-0">
            {/* Conversations list */}
            <div className={cn(
              'md:w-80 w-full border-border/20 bg-muted/20 flex flex-col border-r',
              selectedConversation && showMessages && 'hidden md:flex'
            )}>
              <div className="p-4 border-b border-border/20 bg-background/50">
                <h3 className="font-semibold text-sm text-foreground/80 uppercase tracking-wide">Recent Chats</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {isLoadingConversations ? (
                    <ConversationListSkeleton />
                  ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-luxury/20 to-luxury/5 flex items-center justify-center mb-4 border border-luxury/10">
                        <MessageCircle className="w-10 h-10 text-luxury" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-xs">Start browsing cars to connect with sellers and begin conversations.</p>
                      <Button variant="outline" onClick={() => navigate('/browse')}>Browse Cars</Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => { setSelectedConversation(`${conv.listing_id}|${conv.buyer_id}|${conv.seller_id}`); setShowMessages(true); }}
                          className={cn(
                            'p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-luxury/5 border',
                            selectedConversation === `${conv.listing_id}-${conv.buyer_id}-${conv.seller_id}` ? 'bg-luxury/10 border-luxury/30 shadow-sm' : 'border-transparent hover:border-luxury/20'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                                <AvatarImage src={getProxiedImageUrl(conv.other_user?.avatar_url || '')} />
                                <AvatarFallback className="bg-luxury/10 text-luxury font-semibold">
                                  {conv.other_user?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              {conv.unread_count > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 border-2 border-background rounded-full shadow-lg animate-pulse"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-sm text-foreground truncate">{conv.other_user?.full_name}</h4>
                                {conv.unread_count > 0 && (
                                  <Badge className="h-5 w-5 rounded-full p-0 text-xs bg-gradient-to-r from-luxury to-luxury/80 text-luxury-foreground font-bold flex items-center justify-center min-w-[20px] shadow-lg border border-luxury-foreground/20 animate-pulse">
                                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-foreground/70 font-medium mb-1 truncate">{formatMake(conv.listing?.make)} {formatModel(conv.listing?.model)}</p>
                              {conv.latest_message && (
                                <p className="text-xs text-muted-foreground truncate">{conv.latest_message}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">{formatDateTime(conv.last_message_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Messages area */}
            <div className={cn('flex-1 flex flex-col', !selectedConversation && 'hidden md:flex')}>
              {selectedConversation ? (
                <>
                  {/* Mobile header */}
                  <div className="md:hidden flex items-center p-4 border-b border-border/20 bg-background/50">
                    <Button variant="ghost" size="sm" onClick={() => setShowMessages(false)} className="mr-3 h-8 w-8 p-0">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Avatar className="w-8 h-8 mr-3">
                      <AvatarImage src={getProxiedImageUrl(selectedConv?.other_user?.avatar_url || '')} />
                      <AvatarFallback className="bg-luxury/10 text-luxury">{selectedConv?.other_user?.full_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-sm">{selectedConv?.other_user?.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{formatMake(selectedConv?.listing?.make)} {formatModel(selectedConv?.listing?.model)}</p>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4" onScroll={(e) => {
                    const sc = e.currentTarget;
                    if (sc.scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
                      loadOlderMessages();
                    }
                  }}>
                    <div className="space-y-4">
                      {isLoadingMore && (
                        <div className="flex justify-center py-2 text-muted-foreground text-sm">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading older messages...
                        </div>
                      )}
                      {isLoadingMessages ? (
                        <MessageListSkeleton />
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-luxury/20 to-luxury/5 flex items-center justify-center mb-4 border border-luxury/10">
                            <MessageCircle className="w-8 h-8 text-luxury" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2">Start the conversation</h3>
                          <p className="text-sm text-muted-foreground max-w-sm">Send your first message to begin discussing this car listing.</p>
                        </div>
                      ) : (
                        <>
                          {messages.map((message) => (
                            <div key={message.id} className={cn('flex mb-4 group', message.sender_id === user?.id ? 'justify-end' : 'justify-start')}>
                              <div className="flex items-end gap-2 max-w-[75%]">
                                {message.sender_id !== user?.id && (
                                  <Avatar className="w-6 h-6 mb-1">
                                    <AvatarImage src={getProxiedImageUrl(selectedConv?.other_user?.avatar_url || '')} />
                                    <AvatarFallback className="bg-luxury/10 text-luxury text-xs">{selectedConv?.other_user?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="relative">
                                  <div className={cn('p-3 rounded-2xl shadow-sm border backdrop-blur-sm', message.sender_id === user?.id ? 'bg-luxury text-luxury-foreground border-luxury/20 rounded-br-md' : 'bg-background/80 border-border/30 rounded-bl-md')}>
                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                    <div className="flex items-center justify-between mt-1">
                                      <p className="text-xs opacity-70">
                                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                      {message.sender_id === user?.id && (
                                        <div className="flex items-center text-muted-foreground ml-2">
                                          {message.is_read ? (
                                            <CheckCheck className="w-3 h-3 text-luxury" aria-label="Read" />
                                          ) : (
                                            <CheckCheck className="w-3 h-3 opacity-60" aria-label="Delivered" />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className={cn(
                                    "absolute top-1",
                                    message.sender_id === user?.id ? "-left-8" : "-right-8"
                                  )}>
                                    <MessageMenu
                                      messageId={message.id}
                                      messageContent={message.content}
                                      senderId={message.sender_id}
                                      onMessageDeleted={() => {
                                        if (selectedConversation) {
                                          loadMessages(selectedConversation);
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {showTypingIndicator && (
                            <div className="flex justify-start mb-4">
                              <div className="flex items-end gap-2">
                                <Avatar className="w-6 h-6 mb-1">
                                  <AvatarImage src={selectedConv?.other_user?.avatar_url} />
                                  <AvatarFallback className="bg-luxury/10 text-luxury text-xs">{selectedConv?.other_user?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="p-3 rounded-2xl bg-background/80 border border-border/30 rounded-bl-md">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t border-border/20 bg-background/50 backdrop-blur-sm">
                    <div className="flex gap-3">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) handleSendMessage();
                        }}
                        onInput={() => { if (selectedConversation) handleTyping(selectedConversation, true); }}
                        className="flex-1 border-border/30 focus:border-luxury/50 bg-background/50"
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="px-4 bg-luxury hover:bg-luxury/90 text-luxury-foreground">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-luxury/20 to-luxury/5 flex items-center justify-center mx-auto mb-6 border border-luxury/10">
                      <MessageCircle className="w-12 h-12 text-luxury" />
                    </div>
                    <h3 className="font-semibold text-xl mb-3">Select a conversation</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">Choose a conversation from the list to start messaging with buyers and sellers.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Messages;

