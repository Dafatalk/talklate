import '../global.css';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { NativeWindStyleSheet } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Outfit_400Regular, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConversacionesProvider } from './contexts/ConversacionesContext';
import useThemedNavigation from './hooks/useThemedNavigation';

NativeWindStyleSheet.setOutput({ default: 'native' });

const PANTALLAS_PUBLICAS = ['welcome', 'login', 'signup', 'forgot-password', 'politica-datos'];

// Si no hay sesion solo se ven las pantallas de entrada; con sesion se va a la app
function AuthGate({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAuth();
  const segmentos = useSegments() as string[];
  const enPublica = segmentos[0] === 'screens' && PANTALLAS_PUBLICAS.includes(segmentos[1]);

  useEffect(() => {
    if (cargando) return;
    if (!usuario && !enPublica) router.replace('/screens/welcome');
    else if (usuario && enPublica && segmentos[1] !== 'politica-datos') router.replace('/(drawer)');
  }, [usuario, cargando, enPublica]);

  if (cargando) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator />
      </View>
    );
  }
  return <>{children}</>;
}

function ThemedLayout() {
  const { ThemedStatusBar, screenOptions } = useThemedNavigation();
  return (
    <>
      <ThemedStatusBar />
      <AuthGate>
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        </Stack>
      </AuthGate>
    </>
  );
}

export default function RootLayout() {
  const [fuentes] = useFonts({ Outfit_400Regular, Outfit_700Bold });
  if (!fuentes) return null;
  return (
    <GestureHandlerRootView className={`bg-light-primary dark:bg-dark-primary ${Platform.OS === 'ios' ? 'pb-0 ' : ''}`} style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <ConversacionesProvider>
            <ThemedLayout />
          </ConversacionesProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
