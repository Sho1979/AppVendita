import React, { useRef } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

interface SafeTouchableOpacityProps extends TouchableOpacityProps {
  children: React.ReactNode;
  throttleMs?: number; // Throttle per prevenire doppi click
}

export default function SafeTouchableOpacity({
  children,
  onPress,
  activeOpacity = 0.7,
  throttleMs = 300, // Default 300ms di throttle
  ...props
}: SafeTouchableOpacityProps) {
  const lastPressTime = useRef(0);

  const handlePress = (event: any) => {
    if (!onPress) return;

    const now = Date.now();
    if (now - lastPressTime.current < throttleMs) {
      // Troppo presto, ignora il press
      return;
    }

    lastPressTime.current = now;
    onPress(event);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={activeOpacity}
      delayPressIn={0}
      delayPressOut={0}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}
