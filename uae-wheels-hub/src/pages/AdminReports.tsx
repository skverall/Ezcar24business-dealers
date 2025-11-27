import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';

interface MessageReport {
  id: string;
  message_id: string;
  reported_by: string;
  reported_user: string;
  reason: string;
  additional_info?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  message?: {
    content: string;
    created_at: string;
  };
  reporter?: {
    full_name: string;
    email: string;
  };
  reported_user_info?: {
    full_name: string;
    email: string;
  };
}

export default function AdminReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MessageReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
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
      
      // Type-safe data processing
      const processedReports = (data || []).map(report => {
        // Handle potential error objects in nested data
        let safeReporter = null;
        if (report.reporter && 
            typeof report.reporter === 'object' && 
            report.reporter !== null &&
            !('error' in (report.reporter as any))) {
          safeReporter = report.reporter as { full_name: string; email: string };
        }
        
        let safeReportedUser = null;
        if (report.reported_user_info && 
            typeof report.reported_user_info === 'object' && 
            report.reported_user_info !== null &&
            !('error' in (report.reported_user_info as any))) {
          safeReportedUser = report.reported_user_info as { full_name: string; email: string };
        }
        
        const safeMessage = (report.message && 
                            typeof report.message === 'object' && 
                            !('error' in report.message))
          ? report.message as { content: string; created_at: string }
          : null;
        
        return {
          ...report,
          status: report.status as 'pending' | 'reviewed' | 'resolved' | 'dismissed',
          additional_info: report.additional_info || '',
          admin_notes: report.admin_notes || '',
          reviewed_by: report.reviewed_by || '',
          reviewed_at: report.reviewed_at || '',
          message: safeMessage,
          reporter: safeReporter,
          reported_user_info: safeReportedUser
        } as MessageReport;
      });
      
      setReports(processedReports);
    } catch (error: any) {
      toast({
        title: 'Failed to load reports',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string, notes?: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('message_reports')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null,
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Report updated',
        description: `Report status changed to ${status}`,
      });

      await loadReports();
      setSelectedReport(null);
      setAdminNotes('');
    } catch (error: any) {
      toast({
        title: 'Failed to update report',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewed':
        return <Eye className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'dismissed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'reviewed':
        return 'bg-blue-500';
      case 'resolved':
        return 'bg-green-500';
      case 'dismissed':
        return 'bg-gray-500';
      default:
        return 'bg-red-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury mx-auto mb-4"></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Message Reports</h1>
        <p className="text-muted-foreground">Review and manage user reports about inappropriate messages</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Reports ({reports.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <div className="text-center py-8">
                      <Flag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No reports found</p>
                    </div>
                  ) : (
                    reports.map((report) => (
                      <div
                        key={report.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedReport?.id === report.id
                            ? 'border-luxury bg-luxury/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(report.status)} text-white`}>
                              {getStatusIcon(report.status)}
                              <span className="ml-1 capitalize">{report.status}</span>
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(report.created_at)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <strong>Reporter:</strong> {report.reporter?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm">
                            <strong>Reported User:</strong> {report.reported_user_info?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm">
                            <strong>Reason:</strong> {report.reason.replace('_', ' ')}
                          </p>
                          {report.message && (
                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-2">
                              "{report.message.content}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Report Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedReport ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Message Content</h4>
                    <div className="bg-muted p-3 rounded">
                      {selectedReport.message?.content || 'Message not found'}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Report Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Status:</strong> {selectedReport.status}</p>
                      <p><strong>Reason:</strong> {selectedReport.reason.replace('_', ' ')}</p>
                      <p><strong>Reported:</strong> {formatDateTime(selectedReport.created_at)}</p>
                      {selectedReport.additional_info && (
                        <p><strong>Additional Info:</strong> {selectedReport.additional_info}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Admin Notes</h4>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add admin notes..."
                      className="mb-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => updateReportStatus(selectedReport.id, 'reviewed', adminNotes)}
                      disabled={updating}
                      className="w-full"
                      variant="outline"
                    >
                      Mark as Reviewed
                    </Button>
                    <Button
                      onClick={() => updateReportStatus(selectedReport.id, 'resolved', adminNotes)}
                      disabled={updating}
                      className="w-full"
                      variant="default"
                    >
                      Resolve Report
                    </Button>
                    <Button
                      onClick={() => updateReportStatus(selectedReport.id, 'dismissed', adminNotes)}
                      disabled={updating}
                      className="w-full"
                      variant="destructive"
                    >
                      Dismiss Report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Select a report to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
