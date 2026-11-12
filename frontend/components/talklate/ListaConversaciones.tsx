import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import DrawerButton from '@/components/DrawerButton';
import Icon from '@/components/Icon';
import Glass from '@/components/Glass';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import PromptModal from '@/components/talklate/PromptModal';
import HojaAcciones from '@/components/talklate/HojaAcciones';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useConversaciones } from '@/app/contexts/ConversacionesContext';
import { useDebounce } from '@/app/hooks/useDebounce';
import { coincide } from '@/lib/buscar';
import { api, ResumenConversacion } from '@/lib/api';

const fecha = (iso: string) => new Date(iso).toLocaleDateString();

// Pantalla inicial: el listado completo de conversaciones para retomar cualquiera sin crear una nueva.
// Cada tarjeta muestra solo el titulo, la fecha y un menu de 3 puntos (renombrar / eliminar).
// Barra inferior glass: configuracion (perfil), busqueda (con debounce y tolerante a errores) y nueva conversacion.
export default function ListaConversaciones() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { lista, cargando, refrescar } = useConversaciones();
  const [texto, setTexto] = useState('');
  const q = useDebounce(texto, 250);
  const [menu, setMenu] = useState<ResumenConversacion | null>(null);
  const [renombrar, setRenombrar] = useState<ResumenConversacion | null>(null);
  const [eliminar, setEliminar] = useState<ResumenConversacion | null>(null);
  const [error, setError] = useState('');

  // Busca en el nombre y en el ultimo mensaje, ignorando tildes/puntuacion y typos.
  const visibles = useMemo(() => {
    if (!q.trim()) return lista;
    return lista.filter((c) => {
      const campos = [c.nombre, c.ultimo_mensaje?.contenido, c.ultimo_mensaje?.traduccion].filter(Boolean).join(' ');
      return coincide(q, campos);
    });
  }, [lista, q]);

  const guardarNombre = async (nombre: string) => {
    if (!renombrar) return;
    try { await api.renombrar(renombrar.id, nombre); setRenombrar(null); setError(''); refrescar(); } catch (e: any) { setError(e.message); }
  };
  const borrar = async () => {
    if (!eliminar) return;
    try { await api.eliminar(eliminar.id); setEliminar(null); setError(''); refrescar(); } catch (e: any) { setError(e.message); setEliminar(null); }
  };

  const abrir = (id: string) => router.replace({ pathname: '/(drawer)', params: { id } });
  const gradiente: [string, string] = colors.isDark ? ['#12212a', '#0c0c0d'] : ['#e8f3fb', '#f5f5f5'];

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <LinearGradient colors={gradiente} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <Header style={{ backgroundColor: 'transparent' }} className="!bg-transparent" title="" leftComponent={[<DrawerButton key="menu" />, <ThemedText key="t" className="text-2xl font-outfit-bold ml-4">TalkLate<ThemedText className="text-highlight">.</ThemedText></ThemedText>]} />

      <ThemedScroller style={{ backgroundColor: 'transparent' }} className="pt-2 !bg-transparent" contentContainerStyle={{ paddingBottom: 16 }}>
        <ThemedText className="text-xs uppercase opacity-50 mb-2 tracking-wider">Conversaciones</ThemedText>
        {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
        {!cargando && visibles.length === 0 ? (
          <ThemedText className="opacity-60 text-center mt-10">
            {lista.length === 0 ? 'Aun no tienes conversaciones. Crea una nueva con el boton +.' : 'Sin resultados.'}
          </ThemedText>
        ) : null}
        {visibles.map((c) => (
          <Glass key={c.id} className="rounded-2xl mb-3">
            <View className="flex-row items-center p-4">
              <Pressable className="flex-1 mr-2" onPress={() => abrir(c.id)}>
                <ThemedText className="text-base font-bold" numberOfLines={1}>{c.nombre}</ThemedText>
                <ThemedText className="text-xs opacity-50 mt-1">{fecha(c.ultimo_mensaje?.fecha ?? c.fecha_inicio)}</ThemedText>
              </Pressable>
              <Icon name="EllipsisVertical" size={20} onPress={() => { setError(''); setMenu(c); }} accessibilityLabel="Opciones de la conversacion" />
            </View>
          </Glass>
        ))}
      </ThemedScroller>

      {/* Barra inferior glass: configuracion -> perfil, busqueda y nueva conversacion */}
      <View className="flex-row items-center px-global pt-2" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <Pressable onPress={() => router.push('/screens/profile')} accessibilityRole="button" accessibilityLabel="Configuracion">
          <Glass className="w-11 h-11 rounded-full items-center justify-center">
            <Icon name="Settings" size={20} />
          </Glass>
        </Pressable>
        <Glass className="flex-1 mx-2 rounded-full">
          <View className="flex-row items-center px-3">
            <Icon name="Search" size={18} />
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Buscar"
              placeholderTextColor={colors.placeholder}
              style={{ color: colors.text, flex: 1, height: 44, paddingHorizontal: 8 }}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </Glass>
        <Pressable
          onPress={() => router.push({ pathname: '/(drawer)', params: { nueva: '1' } })}
          accessibilityRole="button"
          accessibilityLabel="Nueva conversacion"
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.highlight }}
        >
          <Icon name="Plus" size={22} color="#ffffff" />
        </Pressable>
      </View>

      <HojaAcciones
        visible={!!menu}
        titulo={menu?.nombre}
        acciones={[
          { etiqueta: 'Renombrar', icono: 'Pencil', onPress: () => { const c = menu; setMenu(null); setRenombrar(c); } },
          { etiqueta: 'Eliminar', icono: 'Trash2', peligro: true, onPress: () => { const c = menu; setMenu(null); setEliminar(c); } },
        ]}
        onCancel={() => setMenu(null)}
      />
      <PromptModal visible={!!renombrar} titulo="Renombrar conversacion" valorInicial={renombrar?.nombre} confirmar="Guardar" error={error} onConfirm={guardarNombre} onCancel={() => { setRenombrar(null); setError(''); }} />
      <PromptModal visible={!!eliminar} titulo="Eliminar conversacion" mensaje={`Se borrara "${eliminar?.nombre}" con todos sus mensajes. Esto no se puede deshacer.`} conCampo={false} peligro confirmar="Eliminar" onConfirm={borrar} onCancel={() => setEliminar(null)} />
    </View>
  );
}
