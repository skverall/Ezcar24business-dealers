import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

export const useIOSOptimizations = () => {
  useEffect(() => {
    let onStatusTap: ((ev: Event) => void) | null = null;

    const setupIOSOptimizations = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Configure status bar
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#000000' });

        // Hide splash screen after app is ready
        await SplashScreen.hide();

        // Configure keyboard behavior
        if (Capacitor.getPlatform() === 'ios') {
          // iOS-specific keyboard optimizations
          Keyboard.addListener('keyboardWillShow', (info) => {
            document.body.style.transform = `translateY(-${info.keyboardHeight / 4}px)`;
          });

          Keyboard.addListener('keyboardWillHide', () => {
            document.body.style.transform = 'translateY(0px)';
          });

          // Handle native status bar tap to scroll to top (Capacitor forwards a 'statusTap' event)
          onStatusTap = () => {
            // Prefer scrolling the main scrollable element smoothly
            const target = document.scrollingElement || document.documentElement;
            target.scrollTo({ top: 0, behavior: 'smooth' });
          };
          window.addEventListener('statusTap', onStatusTap as EventListener);

          // Prevent zoom on input focus
          const viewport = document.querySelector('meta[name=viewport]');
          if (viewport) {
            const originalContent = viewport.getAttribute('content');

            // Add event listeners to all input elements
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
              input.addEventListener('focus', () => {
                viewport.setAttribute('content',
                  'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
                );
              });

              input.addEventListener('blur', () => {
                setTimeout(() => {
                  if (originalContent) {
                    viewport.setAttribute('content', originalContent);
                  }
                }, 100);
              });
            });
          }
        }
      } catch (error) {
        console.error('Error setting up iOS optimizations:', error);
      }
    };

    setupIOSOptimizations();

    // Cleanup function
    return () => {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        Keyboard.removeAllListeners();
        if (onStatusTap) {
          window.removeEventListener('statusTap', onStatusTap as EventListener);
        }
      }
    };
  }, []);

  // Return platform information
  return {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    isIOS: Capacitor.getPlatform() === 'ios',
  };
};
