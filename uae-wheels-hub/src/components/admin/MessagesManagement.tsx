/**
 * Messages Management Component for Admin Panel
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, RefreshCw, Eye, Trash2, MoreHorizontal, CheckCircle2, CircleDashed, Flag } from 'lucide-react';
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
import { formatDistanceToNow } from 'date-fns';
import { AdminMessage, ConversationMessage } from '@/types/admin';
import { AdminApi } from '@/utils/adminApi';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MessagesManagement: React.FC = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage] = useState(1);
  const [limit] = useState(20);
  const { user } = useAdminAuth();
  const { toast } = useToast();

  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('messages');

  const [conversationOpen, setConversationOpen] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, [searchTerm, currentPage]);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await AdminApi.getMessages({
        search: searchTerm || undefined,
        page: currentPage,
        limit: limit
      });

      if (response.success && response.data) {
        setMessages(response.data);
      } else {
        console.error('Failed to load messages:', response.error);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const { data, error } = await supabase
        .from('message_reports')
        .select(`
          *,
          message:messages(content, created_at),
          reporter:profiles!message_reports_reported_by_fkey(full_name, email),
          reported_user_info:profiles!message_reports_reported_user_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast({
        title: 'Failed to load reports',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setReportsLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('message_reports')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Report updated',
        description: `Report status changed to ${status}`,
      });

      await loadReports();
    } catch (error: any) {
      toast({
        title: 'Failed to update report',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.listing_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewConversation = async (messageId: string) => {
    setActiveMessageId(messageId);
    setConversationOpen(true);
    setConversationLoading(true);
    try {
      const res = await AdminApi.getConversationByMessage(messageId, 100, 0);
      if (res.success && res.data) {
        setConversation(res.data);
      } else {
        setConversation([]);
      }
    } catch (e) {
      console.error(e);
      setConversation([]);
    } finally {
      setConversationLoading(false);
    }
  };

  const handleToggleRead = async (messageId: string, isRead: boolean) => {
    try {
      if (!user?.id) throw new Error('No admin user');
      const res = await AdminApi.markMessageRead(messageId, isRead, user.id);
      if (res.success) {
        setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, is_read: isRead } : m)));
        if (activeMessageId === messageId) {
          setConversation(prev => prev.map(c => (c.id === messageId ? { ...c, is_read: isRead } : c)));
        }
      } else {
        alert(res.error || 'Failed to update read state');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update read state');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      if (!user?.id) throw new Error('No admin user');
      const res = await AdminApi.deleteMessage(messageId, user.id);
      if (res.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setConversation(prev => prev.filter(c => c.id !== messageId));
      } else {
        alert(res.error || 'Failed to delete message');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete message');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Messages Management</h2>
          <p className="text-gray-500 mt-1">Monitor and manage user conversations and reports</p>
        </div>
        <Button onClick={activeTab === 'messages' ? loadMessages : loadReports} disabled={loading || reportsLoading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all">
          <RefreshCw className={`w-4 h-4 mr-2 ${(loading || reportsLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Reports ({reports.filter(r => r.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          {/* Search */}
          <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search messages, users, or listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                />
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-800">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span>Messages Inbox <span className="text-gray-400 font-normal text-sm ml-2">({filteredMessages.length} visible)</span></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading messages...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 font-medium">No messages found</p>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? 'Try adjusting your search terms' : 'No messages to display'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 hover:bg-blue-50/30 transition-all duration-200 group ${message.is_read ? 'bg-white' : 'bg-blue-50/50'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1.5">
                            <div className="flex items-center -space-x-2 overflow-hidden">
                              <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700">
                                {message.sender_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">
                                {message.receiver_name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 text-sm">
                                  {message.sender_name}
                                </span>
                                <span className="text-gray-400 text-xs">to</span>
                                <span className="font-medium text-gray-700 text-sm">
                                  {message.receiver_name}
                                </span>
                              </div>
                            </div>
                            {!message.is_read && (
                              <Badge variant="default" className="ml-2 h-5 text-[10px] bg-blue-600 hover:bg-blue-700">
                                New
                              </Badge>
                            )}
                          </div>

                          <div className="pl-11">
                            <p className={`text-sm mb-2 line-clamp-2 ${message.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                              {message.content}
                            </p>

                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium text-gray-600">
                                Re: {message.listing_title}
                              </span>
                              <span>•</span>
                              <span>
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewConversation(message.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Conversation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {message.is_read ? (
                              <DropdownMenuItem onClick={() => handleToggleRead(message.id, false)}>
                                <CircleDashed className="w-4 h-4 mr-2" />
                                Mark as Unread
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleToggleRead(message.id, true)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flag className="w-5 h-5" />
                <span>Message Reports ({reports.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <Flag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 font-medium">No reports found</p>
                  <p className="text-gray-500 text-sm">No message reports to display</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${report.status === 'pending' ? 'bg-yellow-500' :
                              report.status === 'reviewed' ? 'bg-blue-500' :
                                report.status === 'resolved' ? 'bg-green-500' :
                                  'bg-gray-500'
                              } text-white`}>
                              {report.status}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><strong>Reporter:</strong> {report.reporter?.full_name || 'Unknown'}</p>
                            <p><strong>Reported User:</strong> {report.reported_user_info?.full_name || 'Unknown'}</p>
                            <p><strong>Reason:</strong> {report.reason.replace('_', ' ')}</p>
                            {report.message && (
                              <div className="bg-gray-100 p-2 rounded mt-2">
                                <p className="text-xs text-gray-600 mb-1">Reported Message:</p>
                                <p className="text-sm">"{report.message.content}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {report.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateReportStatus(report.id, 'reviewed')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateReportStatus(report.id, 'resolved')}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={conversationOpen} onOpenChange={setConversationOpen}>
        <SheetContent side="right" className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Conversation</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {conversationLoading ? (
              <div className="text-center py-8 text-gray-500">Loading conversation...</div>
            ) : conversation.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No messages in this conversation.</div>
            ) : (
                  <ScrollArea className="h-[70vh] pr-4">
                    <div className="space-y-4">
                      {conversation.map((m) => {
                        // Determine alignment based on sender. 
                        // We'll use the first message's sender as the "left" side (primary)
                        const firstMessage = conversation[0];
                        const isPrimary = !!firstMessage && m.sender_name === firstMessage.sender_name;

                    return (
                      <div key={m.id} className={`flex flex-col gap-1 ${isPrimary ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
                          <span className="font-medium text-gray-700">{m.sender_name}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                        </div>
                        <div className={`p-3 rounded-2xl max-w-[85%] ${isPrimary
                            ? 'bg-gray-100 text-gray-800 rounded-tl-none'
                            : 'bg-blue-600 text-white rounded-tr-none'
                          }`}>
                          <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};

export default MessagesManagement;
