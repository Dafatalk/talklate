import React, { createContext, useContext, useCallback } from 'react';
import { useNavigation } from 'expo-router';

// As of Expo SDK 56, expo-router no longer uses react-navigation; its bundled
// drawer router handles these plain navigation actions (equivalent to the old
// DrawerActions.openDrawer()/closeDrawer()/toggleDrawer()).
const OPEN_DRAWER = { type: 'OPEN_DRAWER' } as const;
const CLOSE_DRAWER = { type: 'CLOSE_DRAWER' } as const;
const TOGGLE_DRAWER = { type: 'TOGGLE_DRAWER' } as const;

interface DrawerContextType {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();

  const openDrawer = useCallback(() => {
    navigation.dispatch(OPEN_DRAWER);
  }, [navigation]);

  const closeDrawer = useCallback(() => {
    navigation.dispatch(CLOSE_DRAWER);
  }, [navigation]);

  const toggleDrawer = useCallback(() => {
    navigation.dispatch(TOGGLE_DRAWER);
  }, [navigation]);

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  
  if (context === undefined) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  
  return context;
}

export default DrawerProvider; 