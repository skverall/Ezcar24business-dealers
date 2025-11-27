import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
}

class PushNotificationService {
  private isInitialized = false;
  private currentToken: string | null = null;

  async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    try {
      // Request permission to use push notifications
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return false;
      }

      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();

      // Set up listeners
      this.setupListeners();

      this.isInitialized = true;
      console.log('Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  private setupListeners() {
    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      this.currentToken = token.value;
      this.saveTokenToDatabase(token.value);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received: ', notification);
      
      // Handle notification based on type
      this.handleNotificationReceived(notification);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed', notification);
      
      // Handle notification tap
      this.handleNotificationTapped(notification);
    });
  }

  private async saveTokenToDatabase(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user logged in, storing token locally');
        localStorage.setItem('pending_push_token', token);
        return;
      }

      // Save token to user's profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          push_token: token,
          push_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
        // Clear any pending token
        localStorage.removeItem('pending_push_token');
      }
    } catch (error) {
      console.error('Error in saveTokenToDatabase:', error);
    }
  }

  private handleNotificationReceived(notification: PushNotificationSchema) {
    // Show local notification if app is in foreground
    if (notification.title && notification.body) {
      // You can customize this based on notification type
      const notificationType = notification.data?.type || 'general';
      
      switch (notificationType) {
        case 'new_message':
          this.showInAppNotification('New Message', notification.body || '');
          break;
        case 'listing_update':
          this.showInAppNotification('Listing Update', notification.body || '');
          break;
        case 'favorite_update':
          this.showInAppNotification('Favorite Update', notification.body || '');
          break;
        default:
          this.showInAppNotification(notification.title || 'Notification', notification.body || '');
      }
    }
  }

  private handleNotificationTapped(notification: ActionPerformed) {
    const data = notification.notification.data;
    
    if (data?.type === 'new_message' && data?.conversationId) {
      // Navigate to messages
      window.location.href = `/messages?conversation=${data.conversationId}`;
    } else if (data?.type === 'listing_update' && data?.listingId) {
      // Navigate to listing
      window.location.href = `/car/${data.listingId}`;
    } else if (data?.type === 'favorite_update' && data?.listingId) {
      // Navigate to listing
      window.location.href = `/car/${data.listingId}`;
    }
  }

  private showInAppNotification(title: string, body: string) {
    // Create a simple in-app notification
    // You can replace this with your preferred toast/notification library
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'ezcar24-notification'
      });
    }
  }

  async updateUserToken() {
    const pendingToken = localStorage.getItem('pending_push_token');
    if (pendingToken) {
      await this.saveTokenToDatabase(pendingToken);
    } else if (this.currentToken) {
      await this.saveTokenToDatabase(this.currentToken);
    }
  }

  async enableNotifications(): Promise<boolean> {
    if (!this.isInitialized) {
      return await this.initialize();
    }
    return true;
  }

  async disableNotifications(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            push_enabled: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  }

  getToken(): string | null {
    return this.currentToken;
  }

  isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const pushNotificationService = new PushNotificationService();
