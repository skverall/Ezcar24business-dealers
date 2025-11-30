import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MessageCircle, Send, User, Check, CheckCheck, Loader2, Search, MoreVertical, Phone, Video } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';

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
  const [searchTerm, setSearchTerm] = useState('');

  const selectedConv = useMemo(() => (
    conversations.find(c => `${c.listing_id}|${c.buyer_id}|${c.seller_id}` === selectedConversation)
  ), [conversations, selectedConversation]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    return conversations.filter(c =>
      c.other_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.listing?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.listing?.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  useEffect(() => {
    if (!user) {
      navigate(`/auth?tab=login&redirect=/messages${listingId && sellerId ? `?listingId=${listingId}&sellerId=${sellerId}` : ''}`);
    }
  }, [user, navigate, listingId, sellerId]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    const ensureConversation = async () => {
      if (!user || !listingId || !sellerId) return;
      if (user.id === sellerId) return;

      if (!logUUIDValidation('Messages ensureConversation', { listingId, sellerId })) {
        toast({
          title: 'Invalid parameters',
          description: `Invalid UUID format`,
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
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header />

      <main className="flex-1 container mx-auto max-w-7xl p-0 md:p-4 lg:p-6 h-[calc(100vh-64px)]">
        <div className="flex h-full md:h-[calc(100vh-140px)] bg-card md:border md:border-border/40 md:rounded-2xl md:shadow-xl overflow-hidden">

          {/* Sidebar - Conversation List */}
          <div className={cn(
            "w-full md:w-[380px] flex flex-col border-r border-border/40 bg-muted/10",
            showMessages ? "hidden md:flex" : "flex"
          )}>
            <div className="p-4 border-b border-border/40">
              <h1 className="text-2xl font-bold mb-4 px-2">Messages</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  className="pl-9 bg-background/50 border-border/40 focus:bg-background transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {isLoadingConversations ? (
                  <ConversationListSkeleton />
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                    <p>No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(`${conv.listing_id}|${conv.buyer_id}|${conv.seller_id}`);
                        setShowMessages(true);
                      }}
                      className={cn(
                        "w-full p-3 rounded-xl flex items-start gap-3 transition-all duration-200 text-left group",
                        selectedConversation === `${conv.listing_id}|${conv.buyer_id}|${conv.seller_id}`
                          ? "bg-primary/10 shadow-sm"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                          <AvatarImage src={getProxiedImageUrl(conv.other_user?.avatar_url || '')} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {conv.other_user?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold truncate text-foreground/90">
                            {conv.other_user?.full_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                            {formatDateTime(conv.last_message_at)}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground font-medium mb-1 truncate flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-muted/50 text-[10px] uppercase tracking-wider">
                            {formatMake(conv.listing?.make)} {formatModel(conv.listing?.model)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-sm truncate max-w-[85%]",
                            conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {conv.latest_message || "Started a conversation"}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className={cn(
            "flex-1 flex flex-col bg-background h-full",
            !showMessages ? "hidden md:flex" : "flex fixed inset-0 z-50 md:static"
          )}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="h-16 px-4 md:px-6 border-b border-border/40 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden -ml-2"
                      onClick={() => setShowMessages(false)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <Avatar className="w-10 h-10 border border-border/50">
                      <AvatarImage src={getProxiedImageUrl(selectedConv?.other_user?.avatar_url || '')} />
                      <AvatarFallback className="bg-primary/5 text-primary">
                        {selectedConv?.other_user?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h2 className="font-semibold text-sm md:text-base leading-none mb-1">
                        {selectedConv?.other_user?.full_name}
                      </h2>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {selectedConv?.listing && (
                          <>
                            <span>{formatMake(selectedConv.listing.make)} {formatModel(selectedConv.listing.model)}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          </>
                        )}
                        <span>Online</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 md:gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <Video className="w-5 h-5" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea
                  className="flex-1 bg-muted/5 p-4 md:p-6"
                  onScroll={(e) => {
                    const sc = e.currentTarget;
                    if (sc.scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
                      loadOlderMessages();
                    }
                  }}
                >
                  <div className="max-w-3xl mx-auto space-y-6 pb-4">
                    {isLoadingMore && (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    )}

                    {isLoadingMessages ? (
                      <MessageListSkeleton />
                    ) : (
                      <>
                        {/* Date Divider (Mock) */}
                        <div className="flex justify-center">
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                            Today
                          </span>
                        </div>

                        {messages.map((message, index) => {
                          const isMe = message.sender_id === user?.id;
                          const isLast = index === messages.length - 1;

                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "flex gap-3 group",
                                isMe ? "justify-end" : "justify-start"
                              )}
                            >
                              {!isMe && (
                                <Avatar className="w-8 h-8 mt-1 border border-border/50">
                                  <AvatarImage src={getProxiedImageUrl(selectedConv?.other_user?.avatar_url || '')} />
                                  <AvatarFallback className="text-[10px]">
                                    {selectedConv?.other_user?.full_name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              <div className={cn(
                                "relative max-w-[80%] md:max-w-[65%]",
                                isMe ? "items-end" : "items-start"
                              )}>
                                <div className={cn(
                                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                                  isMe
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-background border border-border/50 rounded-tl-sm"
                                )}>
                                  {message.content}
                                </div>

                                <div className={cn(
                                  "flex items-center gap-1 mt-1 px-1",
                                  isMe ? "justify-end" : "justify-start"
                                )}>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {isMe && (
                                    message.is_read ? (
                                      <CheckCheck className="w-3 h-3 text-primary" />
                                    ) : (
                                      <Check className="w-3 h-3 text-muted-foreground" />
                                    )
                                  )}
                                </div>

                                <div className={cn(
                                  "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity",
                                  isMe ? "-left-8" : "-right-8"
                                )}>
                                  <MessageMenu
                                    messageId={message.id}
                                    messageContent={message.content}
                                    senderId={message.sender_id}
                                    onMessageDeleted={() => loadMessages(selectedConversation)}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {showTypingIndicator && (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={selectedConv?.other_user?.avatar_url} />
                          <AvatarFallback>{selectedConv?.other_user?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="bg-muted/50 px-4 py-3 rounded-2xl rounded-tl-sm">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 bg-background border-t border-border/40">
                  <div className="max-w-3xl mx-auto flex items-end gap-2">
                    <div className="flex-1 bg-muted/30 rounded-2xl border border-border/40 focus-within:border-primary/50 focus-within:bg-background transition-all flex items-center px-4 py-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none min-h-[24px] max-h-[120px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        onInput={() => { if (selectedConversation) handleTyping(selectedConversation, true); }}
                        as="textarea"
                        rows={1}
                      />
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="icon"
                      className="h-11 w-11 rounded-full shrink-0 shadow-md bg-primary hover:bg-primary/90 transition-all"
                    >
                      <Send className="w-5 h-5 ml-0.5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5">
                <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-6 animate-pulse">
                  <MessageCircle className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Select a conversation from the list to start chatting with buyers or sellers.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
