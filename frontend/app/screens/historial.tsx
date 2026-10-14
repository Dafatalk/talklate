import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import PromptModal from '@/components/talklate/PromptModal';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useConversaciones } from '@/app/contexts/ConversacionesContext';
import { api, ResumenConversacion } from '@/lib/api';

const fecha = (iso: string) => new Date(iso).toLocaleString();

// HU: consultar historial, abrir, renombrar y eliminar conversaciones
export default function HistorialScreen() {
  const colors = useThemeColors();
  const { lista, cargando, refrescar } = useConversaciones();
  const [q, setQ] = useState('');
  const [renombrar, setRenombrar] = useState<ResumenConversacion | null>(null);
  const [eliminar, setEliminar] = useState<ResumenConversacion | null>(null);
  const [error, setError] = useState('');

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? lista.filter((c) => c.nombre.toLowerCase().includes(t)) : lista;
  }, [lista, q]);

  const guardarNombre = async (nombre: string) => {
    if (!renombrar) return;
    try { await api.renombrar(renombrar.id, nombre); setRenombrar(null); setError(''); refrescar(); } catch (e: any) { setError(e.message); }
  };
  const borrar = async () => {
    if (!eliminar) return;
    try { await api.eliminar(eliminar.id); setEliminar(null); setError(''); refrescar(); } catch (e: any) { setError(e.message); setEliminar(null); }
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="Historial" />
      <ThemedScroller className="pt-2">
        <View className="bg-light-secondary dark:bg-dark-secondary rounded-full mb-4 flex-row items-center px-4">
          <Icon name="Search" size={18} />
          <TextInput value={q} onChangeText={setQ} placeholder="Buscar conversaciones" placeholderTextColor={colors.placeholder} style={{ color: colors.text, flex: 1, height: 46, paddingHorizontal: 10 }} />
        </View>
        {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
        {!cargando && visibles.length === 0 ? (
          <ThemedText className="opacity-60 text-center mt-10">{lista.length === 0 ? 'Aun no tienes conversaciones. Empieza una nueva desde el menu.' : 'Sin resultados.'}</ThemedText>
        ) : null}
        {visibles.map((c) => (
          <Pressable key={c.id} onPress={() => router.replace({ pathname: '/(drawer)', params: { id: c.id } })} className="bg-light-secondary dark:bg-dark-secondary rounded-2xl p-4 mb-3">
            <View className="flex-row items-center">
              <View className="flex-1">
                <ThemedText className="text-base font-bold" numberOfLines={1}>{c.nombre}</ThemedText>
                <ThemedText className="text-xs opacity-60">
                  {(c.configuracion.origen ? c.configuracion.origen.idioma : 'Idioma por detectar')} → {c.configuracion.destino.idioma}{c.configuracion.destino.region ? ` (${c.configuracion.destino.region})` : ''} · {c.total_mensajes} mensajes
                </ThemedText>
              </View>
              <Icon name="Pencil" size={18} className="mr-4" onPress={() => { setError(''); setRenombrar(c); }} />
              <Icon name="Trash2" size={18} color="#ef4444" onPress={() => { setError(''); setEliminar(c); }} />
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

      <PromptModal visible={!!renombrar} titulo="Renombrar conversacion" valorInicial={renombrar?.nombre} confirmar="Guardar" error={error} onConfirm={guardarNombre} onCancel={() => { setRenombrar(null); setError(''); }} />
      <PromptModal visible={!!eliminar} titulo="Eliminar conversacion" mensaje={`Se borrara "${eliminar?.nombre}" con todos sus mensajes. Esto no se puede deshacer.`} conCampo={false} peligro confirmar="Eliminar" onConfirm={borrar} onCancel={() => setEliminar(null)} />
    </View>
  );
}
