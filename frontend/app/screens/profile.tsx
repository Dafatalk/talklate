import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import ThemeToggle from '@/components/ThemeToggle';
import Avatar from '@/components/Avatar';
import Glass from '@/components/Glass';
import Icon, { IconName } from '@/components/Icon';
import { Button } from '@/components/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import PromptModal from '@/components/talklate/PromptModal';

const Fila = ({ icono, texto, onPress }: { icono: IconName; texto: string; onPress: () => void }) => (
  <Pressable onPress={onPress} className="flex-row items-center px-5 py-4 border-b border-neutral-200/60 dark:border-neutral-700/60">
    <Icon name={icono} size={20} />
    <ThemedText className="flex-1 ml-4 text-base">{texto}</ThemedText>
    <Icon name="ChevronRight" size={18} className="opacity-50" />
  </Pressable>
);

export default function PerfilScreen() {
  const { usuario, cerrarSesion, eliminarCuenta } = useAuth();
  const colors = useThemeColors();
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');
  if (!usuario) return null;

  // HU Eliminar mi cuenta: derecho al olvido (Ley 1581 de 2012)
  const confirmarEliminar = async (password: string) => {
    try { await eliminarCuenta(password); } catch (e: any) { setError(e.message); }
  };
  const gradiente: [string, string] = colors.isDark ? ['#12212a', '#0c0c0d'] : ['#e8f3fb', '#f5f5f5'];
  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <LinearGradient colors={gradiente} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <Header style={{ backgroundColor: 'transparent' }} className="!bg-transparent" showBackButton title="Mi perfil" />
      <ThemedScroller style={{ backgroundColor: 'transparent' }} className="px-6 !bg-transparent">
        <View className="flex-row items-center pt-8 pb-8">
          <Avatar name={usuario.nombre} size="lg" />
          <View className="ml-4 flex-1">
            <ThemedText className="text-2xl font-bold">{usuario.nombre} {usuario.apellido}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{usuario.correo}</ThemedText>
            <ThemedText className="text-xs mt-1 opacity-60">Nacimiento: {usuario.fecha_nacimiento}{usuario.rol === 'admin' ? ' · Administrador' : ''}</ThemedText>
          </View>
        </View>
        <Glass className="rounded-2xl mb-6">
          <Fila icono="History" texto="Historial de conversaciones" onPress={() => router.push('/screens/historial')} />
          <Fila icono="ShieldCheck" texto="Tratamiento de datos" onPress={() => router.push('/screens/politica-datos')} />
          <Fila icono="Bug" texto="Reportar un problema" onPress={() => router.push('/screens/reportar-problema')} />
          {usuario.rol === 'admin' ? <Fila icono="Globe" texto="Idiomas y regiones" onPress={() => router.push('/screens/admin-idiomas')} /> : null}
          {usuario.rol === 'admin' ? <Fila icono="Flag" texto="Reportes de calidad" onPress={() => router.push('/screens/admin-reportes')} /> : null}
          {usuario.rol === 'admin' ? <Fila icono="Inbox" texto="Problemas reportados" onPress={() => router.push('/screens/admin-problemas')} /> : null}
          <View className="flex-row items-center px-5 py-4">
            <Icon name="Moon" size={20} />
            <ThemedText className="flex-1 ml-4 text-base">Tema claro / oscuro</ThemedText>
            <ThemeToggle />
          </View>
        </Glass>
        <Button title="Cerrar sesion" variant="outline" size="large" iconStart="LogOut" onPress={cerrarSesion} />
        <Button title="Eliminar mi cuenta" variant="ghost" className="mt-4" textClassName="!text-red-500" onPress={() => { setError(''); setEliminando(true); }} />
      </ThemedScroller>
      <PromptModal
        visible={eliminando}
        titulo="Eliminar mi cuenta"
        mensaje="Se borraran tu cuenta, tus conversaciones y tus reportes. Esto no se puede deshacer. Escribe tu contrasena para confirmar."
        placeholder="Contrasena"
        peligro
        secreto
        confirmar="Eliminar"
        error={error}
        onConfirm={confirmarEliminar}
        onCancel={() => setEliminando(false)}
      />
    </View>
  );
}
