import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/app/contexts/ThemeContext';

type Props = {
  children?: React.ReactNode;
  intensity?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

// Superficie "glass" reutilizable: desenfoque (BlurView) + una capa translucida y un borde fino, para que
// lea como vidrio sobre cualquier fondo. Se usa en tarjetas, barras, menus y modales de la app.
export default function Glass({ children, intensity = 40, className = '', style }: Props) {
  const { isDark } = useTheme();
  return (
    <BlurView
      intensity={intensity}
      tint={isDark ? 'dark' : 'light'}
      style={style}
      className={`overflow-hidden border border-black/10 dark:border-white/15 bg-white/30 dark:bg-white/5 ${className}`}
    >
      {children}
    </BlurView>
  );
}
