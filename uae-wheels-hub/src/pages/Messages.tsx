import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MessageCircle, Send, Check, CheckCheck, Loader2, Search, MoreVertical, Phone, Video } from 'lucide-react';
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

      <main className="flex-1 flex pt-16 md:pt-20 h-[calc(100vh)]">
        {/* Sidebar - Conversation List */}
        <div className={cn(
          "w-full md:w-[380px] flex flex-col border-r border-border/40 bg-background/50 backdrop-blur-sm z-10",
          showMessages ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-border/40">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold tracking-tight">Messages</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 bg-secondary/50 border-transparent focus:bg-background focus:border-primary/20 h-10 rounded-xl transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {isLoadingConversations ? (
                <ConversationListSkeleton />
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-muted-foreground">
                  <MessageCircle className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No conversations yet</p>
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
                      "w-full p-4 flex items-start gap-3 transition-all duration-200 text-left hover:bg-secondary/30 border-b border-border/20 last:border-0",
                      selectedConversation === `${conv.listing_id}|${conv.buyer_id}|${conv.seller_id}`
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : "border-l-2 border-l-transparent"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-12 h-12 border border-border/50">
                        <AvatarImage src={getProxiedImageUrl(conv.other_user?.avatar_url || '')} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-primary font-medium">
                          {conv.other_user?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <span className={cn(
                          "font-semibold text-sm truncate pr-2",
                          conv.unread_count > 0 ? "text-foreground" : "text-foreground/90"
                        )}>
                          {conv.other_user?.full_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground/80 shrink-0">
                          {formatDateTime(conv.last_message_at)}
                        </span>
                      </div>

                      <div className="text-[11px] font-medium text-muted-foreground mb-1 truncate">
                        {formatMake(conv.listing?.make)} {formatModel(conv.listing?.model)}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "text-xs truncate leading-relaxed max-w-[90%]",
                          conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {conv.latest_message || "Started a conversation"}
                        </p>
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
          "flex-1 flex flex-col bg-background h-full relative",
          !showMessages ? "hidden md:flex" : "flex fixed inset-0 z-50 md:static pt-0"
        )}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 border-b border-border/40 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 h-9 w-9"
                    onClick={() => setShowMessages(false)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>

                  <Avatar className="w-9 h-9 border border-border/50">
                    <AvatarImage src={getProxiedImageUrl(selectedConv?.other_user?.avatar_url || '')} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs">
                      {selectedConv?.other_user?.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h2 className="font-semibold text-sm leading-none mb-0.5">
                      {selectedConv?.other_user?.full_name}
                    </h2>
                    {selectedConv?.listing && (
                      <p className="text-[11px] text-muted-foreground">
                        {formatMake(selectedConv.listing.make)} {formatModel(selectedConv.listing.model)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-4 mx-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea
                className="flex-1 bg-muted/5 p-4"
                onScroll={(e) => {
                  const sc = e.currentTarget;
                  if (sc.scrollTop < 50 && hasMoreMessages && !isLoadingMore) {
                    loadOlderMessages();
                  }
                }}
              >
                <div className="max-w-3xl mx-auto space-y-6 pb-4 pt-2">
                  {isLoadingMore && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {isLoadingMessages ? (
                    <MessageListSkeleton />
                  ) : (
                    <>
                      {messages.map((message, index) => {
                        const isMe = message.sender_id === user?.id;
                        const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== message.sender_id);

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-2 group",
                              isMe ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isMe && (
                              <div className="w-8 flex-shrink-0">
                                {showAvatar && (
                                  <Avatar className="w-8 h-8 border border-border/50">
                                    <AvatarImage src={getProxiedImageUrl(selectedConv?.other_user?.avatar_url || '')} />
                                    <AvatarFallback className="text-[10px]">
                                      {selectedConv?.other_user?.full_name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            )}

                            <div className={cn(
                              "relative max-w-[80%] md:max-w-[70%]",
                              isMe ? "items-end" : "items-start"
                            )}>
                              <div className={cn(
                                "px-4 py-2 text-sm leading-relaxed shadow-sm",
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                  : "bg-background border border-border/50 rounded-2xl rounded-tl-sm"
                              )}>
                                {message.content}
                              </div>

                              <div className={cn(
                                "flex items-center gap-1 mt-1 px-1 opacity-60",
                                isMe ? "justify-end" : "justify-start"
                              )}>
                                <span className="text-[10px]">
                                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && (
                                  message.is_read ? (
                                    <CheckCheck className="w-3 h-3" />
                                  ) : (
                                    <Check className="w-3 h-3" />
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
                    <div className="flex items-center gap-2 ml-10">
                      <div className="bg-muted/50 px-3 py-2 rounded-2xl rounded-tl-sm">
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
              <div className="p-3 md:p-4 bg-background border-t border-border/40">
                <div className="max-w-3xl mx-auto flex items-end gap-2">
                  <div className="flex-1 bg-secondary/30 rounded-2xl border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-all flex items-center px-4 py-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none min-h-[24px] max-h-[120px] resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      onInput={() => { if (selectedConversation) handleTyping(selectedConversation, true); }}
                      rows={1}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="icon"
                    className="h-10 w-10 rounded-full shrink-0 shadow-sm bg-primary hover:bg-primary/90 transition-all"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5">
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 ring-1 ring-primary/10">
                <MessageCircle className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Select a chat from the list or browse cars to contact a seller.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;

