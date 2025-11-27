import { useCallback } from 'react';
import { hapticService, HapticFeedbackType } from '@/services/hapticService';

export const useHaptics = () => {
  const trigger = useCallback(async (type: HapticFeedbackType) => {
    await hapticService.trigger(type);
  }, []);

  const impact = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    await hapticService.impact(style);
  }, []);

  const notification = useCallback(async (type: 'success' | 'warning' | 'error') => {
    await hapticService.notification(type);
  }, []);

  const selection = useCallback(async () => {
    await hapticService.selection();
  }, []);

  // Convenience methods for common UI interactions
  const buttonPress = useCallback(async () => {
    await hapticService.buttonPress();
  }, []);

  const buttonLongPress = useCallback(async () => {
    await hapticService.buttonLongPress();
  }, []);

  const toggleSwitch = useCallback(async () => {
    await hapticService.toggleSwitch();
  }, []);

  const cardTap = useCallback(async () => {
    await hapticService.cardTap();
  }, []);

  const pullToRefresh = useCallback(async () => {
    await hapticService.pullToRefresh();
  }, []);

  const swipeAction = useCallback(async () => {
    await hapticService.swipeAction();
  }, []);

  const deleteAction = useCallback(async () => {
    await hapticService.deleteAction();
  }, []);

  const successAction = useCallback(async () => {
    await hapticService.successAction();
  }, []);

  const errorAction = useCallback(async () => {
    await hapticService.errorAction();
  }, []);

  const favoriteToggle = useCallback(async () => {
    await hapticService.favoriteToggle();
  }, []);

  const messageReceived = useCallback(async () => {
    await hapticService.messageReceived();
  }, []);

  const messageSent = useCallback(async () => {
    await hapticService.messageSent();
  }, []);

  const photoCapture = useCallback(async () => {
    await hapticService.photoCapture();
  }, []);

  const listingCreated = useCallback(async () => {
    await hapticService.listingCreated();
  }, []);

  const listingDeleted = useCallback(async () => {
    await hapticService.listingDeleted();
  }, []);

  const searchResults = useCallback(async () => {
    await hapticService.searchResults();
  }, []);

  const navigationTap = useCallback(async () => {
    await hapticService.navigationTap();
  }, []);

  const isSupported = hapticService.isSupported();

  return {
    trigger,
    impact,
    notification,
    selection,
    buttonPress,
    buttonLongPress,
    toggleSwitch,
    cardTap,
    pullToRefresh,
    swipeAction,
    deleteAction,
    successAction,
    errorAction,
    favoriteToggle,
    messageReceived,
    messageSent,
    photoCapture,
    listingCreated,
    listingDeleted,
    searchResults,
    navigationTap,
    isSupported
  };
};
