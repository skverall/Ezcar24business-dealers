import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { hapticService } from '@/services/hapticService';

export interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
  files?: string[]; // For sharing images or files
}

export interface ShareResult {
  success: boolean;
  method: 'native' | 'web' | 'clipboard';
  error?: string;
}

export const shareContent = async (options: ShareOptions): Promise<ShareResult> => {
  try {
    // Trigger haptic feedback for share action
    await hapticService.buttonPress();

    // Use Capacitor Share plugin on native platforms
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle || options.title,
        files: options.files,
      });

      // Success haptic feedback
      await hapticService.successAction();

      return {
        success: true,
        method: 'native'
      };
    }

    // Use Web Share API if available on web
    if (navigator.share && options.url) {
      // Check if Web Share API can handle the data
      const shareData = {
        title: options.title,
        text: options.text,
        url: options.url
      };

      if (navigator.canShare && !navigator.canShare(shareData)) {
        throw new Error('Cannot share this content');
      }

      await navigator.share(shareData);

      return {
        success: true,
        method: 'web'
      };
    } else if (options.url) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(options.url);

      return {
        success: true,
        method: 'clipboard'
      };
    }
  } catch (error: any) {
    console.error('Share failed:', error);

    // Don't trigger error haptic for user cancellation
    if (!error.message?.includes('cancelled') && !error.message?.includes('canceled')) {
      await hapticService.errorAction();
    }

    // Final fallback - try clipboard if URL is available
    if (options.url) {
      try {
        await navigator.clipboard.writeText(options.url);

        return {
          success: true,
          method: 'clipboard'
        };
      } catch (clipboardError) {
        console.error('Clipboard fallback failed:', clipboardError);

        return {
          success: false,
          method: 'clipboard',
          error: 'Unable to share or copy link'
        };
      }
    }
  }

  return {
    success: false,
    method: 'native',
    error: 'No URL provided for sharing'
  };
};
