import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticFeedbackType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'selection';

class HapticService {
  private isEnabled = true;

  constructor() {
    // Check if haptics are supported
    if (!this.isSupported()) {
      console.log('Haptic feedback not supported on this platform');
    }
  }

  async impact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    if (!this.isEnabled || !this.isSupported()) {
      return;
    }

    try {
      let impactStyle: ImpactStyle;
      switch (style) {
        case 'light':
          impactStyle = ImpactStyle.Light;
          break;
        case 'heavy':
          impactStyle = ImpactStyle.Heavy;
          break;
        default:
          impactStyle = ImpactStyle.Medium;
      }

      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Error triggering haptic impact:', error);
    }
  }

  async notification(type: 'success' | 'warning' | 'error'): Promise<void> {
    if (!this.isEnabled || !this.isSupported()) {
      return;
    }

    try {
      let notificationType: NotificationType;
      switch (type) {
        case 'success':
          notificationType = NotificationType.Success;
          break;
        case 'warning':
          notificationType = NotificationType.Warning;
          break;
        case 'error':
          notificationType = NotificationType.Error;
          break;
      }

      await Haptics.notification({ type: notificationType });
    } catch (error) {
      console.error('Error triggering haptic notification:', error);
    }
  }

  async selection(): Promise<void> {
    if (!this.isEnabled || !this.isSupported()) {
      return;
    }

    try {
      await Haptics.selectionStart();
      // Small delay for better feel
      setTimeout(async () => {
        try {
          await Haptics.selectionChanged();
        } catch (error) {
          console.error('Error triggering selection changed haptic:', error);
        }
      }, 50);
    } catch (error) {
      console.error('Error triggering haptic selection:', error);
    }
  }

  // Convenience methods for common UI interactions
  async buttonPress(): Promise<void> {
    await this.impact('light');
  }

  async buttonLongPress(): Promise<void> {
    await this.impact('medium');
  }

  async toggleSwitch(): Promise<void> {
    await this.selection();
  }

  async cardTap(): Promise<void> {
    await this.impact('light');
  }

  async pullToRefresh(): Promise<void> {
    await this.impact('medium');
  }

  async swipeAction(): Promise<void> {
    await this.impact('light');
  }

  async deleteAction(): Promise<void> {
    await this.notification('warning');
  }

  async successAction(): Promise<void> {
    await this.notification('success');
  }

  async errorAction(): Promise<void> {
    await this.notification('error');
  }

  async favoriteToggle(): Promise<void> {
    await this.impact('light');
  }

  async messageReceived(): Promise<void> {
    await this.impact('light');
  }

  async messageSent(): Promise<void> {
    await this.impact('light');
  }

  async photoCapture(): Promise<void> {
    await this.impact('medium');
  }

  async listingCreated(): Promise<void> {
    await this.notification('success');
  }

  async listingDeleted(): Promise<void> {
    await this.notification('warning');
  }

  async searchResults(): Promise<void> {
    await this.impact('light');
  }

  async navigationTap(): Promise<void> {
    await this.selection();
  }

  // Generic method that maps feedback types to appropriate haptic patterns
  async trigger(type: HapticFeedbackType): Promise<void> {
    switch (type) {
      case 'light':
        await this.impact('light');
        break;
      case 'medium':
        await this.impact('medium');
        break;
      case 'heavy':
        await this.impact('heavy');
        break;
      case 'success':
        await this.notification('success');
        break;
      case 'warning':
        await this.notification('warning');
        break;
      case 'error':
        await this.notification('error');
        break;
      case 'selection':
        await this.selection();
        break;
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }
}

export const hapticService = new HapticService();
