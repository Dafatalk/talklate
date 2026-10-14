import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useThemeColors } from '../contexts/ThemeColors';
import CustomDrawerContent from '@/components/CustomDrawerContent';

export default function DrawerLayout() {
  const colors = useThemeColors();
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerPosition: 'left',
        drawerStyle: { backgroundColor: colors.bg, width: '85%', flex: 1 },
        overlayColor: 'rgba(0,0,0, 0.4)',
        swipeEdgeWidth: 100,
      }}
      drawerContent={() => <CustomDrawerContent />}
    >
      <Drawer.Screen name="index" options={{ title: 'TalkLate', drawerLabel: 'TalkLate' }} />
    </Drawer>
  );
}
