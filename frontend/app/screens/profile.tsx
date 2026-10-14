import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import ThemeToggle from '@/components/ThemeToggle';
import Avatar from '@/components/Avatar';
import Icon, { IconName } from '@/components/Icon';
import { Button } from '@/components/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { shadowPresets } from '@/utils/useShadow';

const Fila = ({ icono, texto, onPress }: { icono: IconName; texto: string; onPress: () => void }) => (
  <Pressable onPress={onPress} className="flex-row items-center px-5 py-4 border-b border-neutral-200/60 dark:border-neutral-700/60">
    <Icon name={icono} size={20} />
    <ThemedText className="flex-1 ml-4 text-base">{texto}</ThemedText>
    <Icon name="ChevronRight" size={18} className="opacity-50" />
  </Pressable>
);

export default function PerfilScreen() {
  const { usuario, cerrarSesion } = useAuth();
  if (!usuario) return null;
  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="Mi perfil" />
      <ThemedScroller className="px-6">
        <View className="flex-row items-center pt-8 pb-8">
          <Avatar name={usuario.nombre} size="lg" />
          <View className="ml-4 flex-1">
            <ThemedText className="text-2xl font-bold">{usuario.nombre} {usuario.apellido}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{usuario.correo}</ThemedText>
            <ThemedText className="text-xs mt-1 opacity-60">Nacimiento: {usuario.fecha_nacimiento}{usuario.rol === 'admin' ? ' · Administrador' : ''}</ThemedText>
          </View>
        </View>
        <View style={shadowPresets.medium} className="bg-light-secondary dark:bg-dark-secondary/50 rounded-2xl overflow-hidden mb-6">
          <Fila icono="History" texto="Historial de conversaciones" onPress={() => router.push('/screens/historial')} />
          {usuario.rol === 'admin' ? <Fila icono="Globe" texto="Idiomas y regiones" onPress={() => router.push('/screens/admin-idiomas')} /> : null}
          {usuario.rol === 'admin' ? <Fila icono="Flag" texto="Reportes de calidad" onPress={() => router.push('/screens/admin-reportes')} /> : null}
          <View className="flex-row items-center px-5 py-4">
            <Icon name="Moon" size={20} />
            <ThemedText className="flex-1 ml-4 text-base">Tema claro / oscuro</ThemedText>
            <ThemeToggle />
          </View>
        </View>
        <Button title="Cerrar sesion" variant="outline" size="large" iconStart="LogOut" onPress={cerrarSesion} />
      </ThemedScroller>
    </View>
  );
}
