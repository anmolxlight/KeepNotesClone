import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import theme from '../styles/theme';

interface FloatingActionButtonProps {
  icon: string;
  iconType: 'ionicons' | 'materialicons';
  onPress: () => void;
  style?: ViewStyle;
  backgroundColor?: string;
  size?: number;
  iconSize?: number;
}

export default function FloatingActionButton({
  icon,
  iconType,
  onPress,
  style,
  backgroundColor = theme.colors.fabBackground,
  size = 56,
  iconSize = 24,
}: FloatingActionButtonProps) {
  const IconComponent = iconType === 'ionicons' ? Ionicons : MaterialIcons;

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <IconComponent
        name={icon as any}
        size={iconSize}
        color={theme.colors.onPrimary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
}); 