import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

interface SafeTouchableOpacityProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

export default function SafeTouchableOpacity({
  children,
  onPress,
  activeOpacity = 0.7,
  ...props
}: SafeTouchableOpacityProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={activeOpacity}
      delayPressIn={0}
      delayPressOut={0}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}
