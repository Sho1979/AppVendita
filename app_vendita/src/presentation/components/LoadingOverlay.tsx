import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string | undefined;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}> 
      <View style={styles.card}>
        <ActivityIndicator size={Platform.OS === 'web' ? 'large' : 'small'} color={Colors.primary} />
        {message ? <Text style={styles.msg}>{message}</Text> : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Platform.OS === 'web' ? { boxShadow: '0 6px 16px rgba(0,0,0,0.15)' } : { elevation: 5 }),
  },
  msg: {
    marginTop: 8,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoadingOverlay;


