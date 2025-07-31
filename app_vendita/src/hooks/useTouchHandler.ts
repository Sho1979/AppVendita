import { useRef, useCallback } from 'react';
import { GestureResponderEvent } from 'react-native';

interface TouchHandlerOptions {
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  onPressIn?: ((event: GestureResponderEvent) => void) | undefined;
  onPressOut?: ((event: GestureResponderEvent) => void) | undefined;
}

export function useTouchHandler(options: TouchHandlerOptions) {
  const touchStartRef = useRef<boolean>(false);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      touchStartRef.current = true;

      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }

      if (options.onPressIn) {
        options.onPressIn(event);
      }
    },
    [options.onPressIn]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (touchStartRef.current) {
        touchStartRef.current = false;

        if (options.onPressOut) {
          options.onPressOut(event);
        }
      }
    },
    [options.onPressOut]
  );

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (touchStartRef.current && options.onPress) {
        options.onPress(event);
      }
    },
    [options.onPress]
  );

  return {
    handlePressIn,
    handlePressOut,
    handlePress,
  };
}
