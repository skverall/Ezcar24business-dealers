import { useCallback, useRef } from 'react';
import { hapticService } from '@/services/hapticService';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number; // milliseconds
}

export const useLongPress = ({
  onLongPress,
  onClick,
  threshold = 500
}: UseLongPressOptions) => {
  const isLongPress = useRef(false);
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget>();

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    // Prevent default to avoid context menu on long press
    if ('touches' in event) {
      event.preventDefault();
    }

    target.current = event.target;
    timeout.current = setTimeout(async () => {
      isLongPress.current = true;

      // Native haptic feedback for long press
      try { await hapticService.buttonLongPress(); } catch {}

      onLongPress();
    }, threshold);
  }, [onLongPress, threshold]);

  const clear = useCallback((event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
    timeout.current && clearTimeout(timeout.current);

    if (shouldTriggerClick && !isLongPress.current && onClick) {
      onClick();
    }

    isLongPress.current = false;
  }, [onClick]);

  return {
    onTouchStart: start,
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onTouchMove: (e: React.TouchEvent) => clear(e, false),
    onMouseDown: start,
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
  };
};
