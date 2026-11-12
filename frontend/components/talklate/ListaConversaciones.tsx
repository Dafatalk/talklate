import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import DrawerButton from '@/components/DrawerButton';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import PromptModal from '@/components/talklate/PromptModal';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useConversaciones } from '@/app/contexts/ConversacionesContext';
import { useDebounce } from '@/app/hooks/useDebounce';
import { coincide } from '@/lib/buscar';
import { api, ResumenConversacion } from '@/lib/api';

const fecha = (iso: string) => new Date(iso).toLocaleDateString();

// Pantalla inicial: el listado completo de conversaciones para retomar cualquiera sin crear una nueva.
// Barra inferior fija: configuracion (perfil), reportar un problema, busqueda (con debounce y tolerante a
// errores) y nueva conversacion.
export default function ListaConversaciones() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { lista, cargando, refrescar } = useConversaciones();
  const [texto, setTexto] = useState('');
  const q = useDebounce(texto, 250);
  const [renombrar, setRenombrar] = useState<ResumenConversacion | null>(null);
  const [eliminar, setEliminar] = useState<ResumenConversacion | null>(null);
  const [error, setError] = useState('');

  // Busca en el nombre y en el ultimo mensaje (contenido + traduccion), ignorando tildes/puntuacion y typos.
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

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header title="" leftComponent={[<DrawerButton key="menu" />, <ThemedText key="t" className="text-2xl font-outfit-bold ml-4">TalkLate<ThemedText className="text-highlight">.</ThemedText></ThemedText>]} />

      <ThemedScroller className="pt-2" contentContainerStyle={{ paddingBottom: 16 }}>
        <ThemedText className="text-xs uppercase opacity-50 mb-2 tracking-wider">Conversaciones</ThemedText>
        {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
        {!cargando && visibles.length === 0 ? (
          <ThemedText className="opacity-60 text-center mt-10">
            {lista.length === 0 ? 'Aun no tienes conversaciones. Crea una nueva con el boton +.' : 'Sin resultados.'}
          </ThemedText>
        ) : null}
        {visibles.map((c) => (
          <Pressable key={c.id} onPress={() => abrir(c.id)} className="bg-light-secondary dark:bg-dark-secondary rounded-2xl p-4 mb-3">
            <View className="flex-row items-center">
              <View className="flex-1 mr-3">
                <ThemedText className="text-base font-bold" numberOfLines={1}>{c.nombre}</ThemedText>
                <ThemedText className="text-xs opacity-60" numberOfLines={1}>
                  {(c.configuracion.origen ? c.configuracion.origen.idioma : 'Idioma por detectar')} → {c.configuracion.destino.idioma}{c.configuracion.destino.region ? ` (${c.configuracion.destino.region})` : ''} · {c.total_mensajes} mensajes
                </ThemedText>
              </View>
              <Icon name="Pencil" size={18} className="mr-4" onPress={() => { setError(''); setRenombrar(c); }} accessibilityLabel="Renombrar" />
              <Icon name="Trash2" size={18} color="#ef4444" onPress={() => { setError(''); setEliminar(c); }} accessibilityLabel="Eliminar" />
            </View>
            {c.ultimo_mensaje ? (
              <View className="mt-3">
                <ThemedText className="text-sm" numberOfLines={1}>{c.ultimo_mensaje.contenido}</ThemedText>
                {c.ultimo_mensaje.traduccion ? <ThemedText className="text-sm text-highlight" numberOfLines={1}>{c.ultimo_mensaje.traduccion}</ThemedText> : null}
                <ThemedText className="text-xs opacity-50 mt-1">{fecha(c.ultimo_mensaje.fecha)}</ThemedText>
              </View>
            ) : null}
          </Pressable>
        ))}
      </ThemedScroller>

      {/* Barra inferior: configuracion -> perfil, reportar problema, busqueda y nueva conversacion */}
      <View
        className="flex-row items-center px-global pt-3 border-t border-light-secondary dark:border-dark-secondary"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Icon name="Settings" variant="contained" iconSize="s" onPress={() => router.push('/screens/profile')} accessibilityLabel="Configuracion" />
        <View className="flex-1 mx-2 flex-row items-center bg-light-secondary dark:bg-dark-secondary rounded-full px-3">
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
        <Icon name="Bug" variant="contained" iconSize="s" onPress={() => router.push('/screens/reportar-problema')} accessibilityLabel="Reportar un problema" />
        <Pressable
          onPress={() => router.push({ pathname: '/(drawer)', params: { nueva: '1' } })}
          accessibilityRole="button"
          accessibilityLabel="Nueva conversacion"
          className="w-10 h-10 ml-2 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.highlight }}
        >
          <Icon name="Plus" size={22} color="#ffffff" />
        </Pressable>
      </View>

      <PromptModal visible={!!renombrar} titulo="Renombrar conversacion" valorInicial={renombrar?.nombre} confirmar="Guardar" error={error} onConfirm={guardarNombre} onCancel={() => { setRenombrar(null); setError(''); }} />
      <PromptModal visible={!!eliminar} titulo="Eliminar conversacion" mensaje={`Se borrara "${eliminar?.nombre}" con todos sus mensajes. Esto no se puede deshacer.`} conCampo={false} peligro confirmar="Eliminar" onConfirm={borrar} onCancel={() => setEliminar(null)} />
    </View>
  );
}
