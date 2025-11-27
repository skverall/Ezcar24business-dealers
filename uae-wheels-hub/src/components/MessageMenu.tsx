import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Trash2, Flag, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MessageMenuProps {
  messageId: string;
  messageContent: string;
  senderId: string;
  onMessageDeleted?: () => void;
}

export default function MessageMenu({ 
  messageId, 
  messageContent, 
  senderId, 
  onMessageDeleted 
}: MessageMenuProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const isOwnMessage = user?.id === senderId;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      toast({
        title: 'Message copied',
        description: 'Message has been copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy message to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMessage = async () => {
    if (!isOwnMessage) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id); // Extra security check

      if (error) throw error;

      toast({
        title: 'Message deleted',
        description: 'Your message has been deleted successfully',
      });

      onMessageDeleted?.();
    } catch (error: any) {
      toast({
        title: 'Failed to delete message',
        description: error.message || 'Could not delete the message',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleReportMessage = async () => {
    if (isOwnMessage) return;

    setIsReporting(true);
    try {
      // Create a report in the database
      const { error } = await supabase
        .from('message_reports')
        .insert({
          message_id: messageId,
          reported_by: user?.id,
          reported_user: senderId,
          reason: 'inappropriate_content',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Report submitted',
        description: 'Thank you for reporting. Our team will review this message.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to submit report',
        description: error.message || 'Could not submit the report',
        variant: 'destructive',
      });
    } finally {
      setIsReporting(false);
      setShowReportDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted/50"
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCopyMessage}>
            <Copy className="w-4 h-4 mr-2" />
            Copy message
          </DropdownMenuItem>
          
          {isOwnMessage ? (
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete message
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowReportDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Flag className="w-4 h-4 mr-2" />
                Report message
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Confirmation Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this message for inappropriate content? 
              Our moderation team will review it and take appropriate action if necessary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReportMessage}
              disabled={isReporting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isReporting ? 'Reporting...' : 'Report'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
