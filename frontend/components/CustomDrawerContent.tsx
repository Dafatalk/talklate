import React, { useMemo, useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from './ThemedText';
import ThemedScroller from './ThemeScroller';
import ThemeToggle from './ThemeToggle';
import Icon, { IconName } from './Icon';
import Avatar from './Avatar';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useAuth } from '@/app/contexts/AuthContext';
import { useConversaciones } from '@/app/contexts/ConversacionesContext';

type NavItemProps = { onPress: () => void; icon: IconName; label: string; description?: string };

export const NavItem = ({ onPress, icon, label, description }: NavItemProps) => (
  <TouchableOpacity onPress={onPress} className="flex-row items-center py-2">
    <View className="flex-row items-center justify-center w-9 h-9 bg-light-primary dark:bg-dark-secondary rounded-lg">
      <Icon name={icon} size={18} />
    </View>
    <View className="flex-1 ml-4">
      <ThemedText className="text-base font-bold text-gray-800 dark:text-gray-200">{label}</ThemedText>
      {description ? <ThemedText className="opacity-50 text-xs">{description}</ThemedText> : null}
    </View>
  </TouchableOpacity>
);

// Menu lateral: nueva conversacion, historial con busqueda, administracion (si aplica) y perfil
export default function CustomDrawerContent() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { usuario } = useAuth();
  const { lista } = useConversaciones();
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (q ? lista.filter((c) => c.nombre.toLowerCase().includes(q)) : lista).slice(0, 30);
  }, [lista, busqueda]);

  return (
    <View className="flex-1 px-global bg-white dark:bg-dark-primary" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ThemedScroller className="flex-1 px-0 bg-white dark:bg-dark-primary">
        <View className="flex-row justify-between items-center mt-4">
          <View className="bg-light-primary dark:bg-white/20 rounded-full relative flex-1 mr-4">
            <Icon name="Search" className="absolute top-3.5 left-4 z-50" size={20} />
            <TextInput
              className="h-[47px] pl-12 pr-3 rounded-lg text-black dark:text-white"
              placeholder="Buscar conversaciones"
              placeholderTextColor={colors.placeholder}
              value={busqueda}
              onChangeText={setBusqueda}
              returnKeyType="done"
            />
          </View>
          <ThemeToggle />
        </View>

        <View className="flex-col pb-4 mb-4 mt-4 border-b border-neutral-200 dark:border-dark-secondary">
          <NavItem onPress={() => router.replace('/(drawer)')} icon="Plus" label="Nueva conversacion" />
          <NavItem onPress={() => router.push('/screens/historial')} icon="History" label="Historial" description="Renombrar o eliminar conversaciones" />
          {usuario?.rol === 'admin' ? (
            <>
              <NavItem onPress={() => router.push('/screens/admin-idiomas')} icon="Globe" label="Idiomas y regiones" description="Administrador" />
              <NavItem onPress={() => router.push('/screens/admin-reportes')} icon="Flag" label="Reportes de calidad" description="Administrador" />
            </>
          ) : null}
        </View>

        {visibles.length === 0 ? (
          <ThemedText className="opacity-50 text-sm">{lista.length === 0 ? 'Aun no tienes conversaciones.' : 'Sin resultados.'}</ThemedText>
        ) : null}
        {visibles.map((c) => (
          <TouchableOpacity key={c.id} className="py-3" onPress={() => router.replace({ pathname: '/(drawer)', params: { id: c.id } })}>
            <ThemedText className="text-base font-semibold" numberOfLines={1}>{c.nombre}</ThemedText>
            <ThemedText className="opacity-50 text-xs" numberOfLines={1}>
              {c.ultimo_mensaje ? c.ultimo_mensaje.contenido : `${c.configuracion.destino.idioma}${c.configuracion.destino.region ? ' · ' + c.configuracion.destino.region : ''}`}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedScroller>

      <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/screens/profile')} className="flex-row justify-start items-center pt-4 pb-4 border-t border-neutral-200 dark:border-dark-secondary">
        <Avatar name={usuario ? usuario.nombre : '?'} size="md" />
        <View className="ml-4 flex-1">
          <ThemedText className="text-base font-semibold" numberOfLines={1}>{usuario ? `${usuario.nombre} ${usuario.apellido}` : ''}</ThemedText>
          <ThemedText className="opacity-50 text-xs" numberOfLines={1}>{usuario?.correo}</ThemedText>
        </View>
        <Icon name="ChevronRight" size={18} className="ml-auto" />
      </TouchableOpacity>
    </View>
  );
}
