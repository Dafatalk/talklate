import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { useTheme } from '@/app/contexts/ThemeContext';
import useThemeColors from '@/app/contexts/ThemeColors';

/**
 * A hook that handles theme-dependent styling for navigation and status bars
 * Returns configuration objects and components for themed navigation
 */
export default function useThemedNavigation() {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  
  // StatusBar y barra de navegacion de Android segun el tema.
  // Desde SDK 57 la app es edge-to-edge: ya no se pinta el fondo de las barras
  // (setBackgroundColorAsync/setButtonStyleAsync se eliminaron); solo se elige el
  // color de los botones: con tema oscuro, botones claros ('light'), igual que la StatusBar.
  const ThemedStatusBar = () => (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {Platform.OS === 'android' && <NavigationBar style={isDark ? 'light' : 'dark'} />}
    </>
  );

  // Navigation container/stack screen options for themed backgrounds
  const screenOptions = {
    headerShown: false,
    backgroundColor: colors.bg,
    contentStyle: { 
      backgroundColor: colors.bg 
    }
  };

  return {
    ThemedStatusBar,
    screenOptions,
    colors,
    isDark
  };
} 