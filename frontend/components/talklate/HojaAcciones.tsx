import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from '@/components/ThemedText';
import Icon, { IconName } from '@/components/Icon';
import Glass from '@/components/Glass';

export type Accion = { etiqueta: string; icono: IconName; peligro?: boolean; onPress: () => void };

// Menu de acciones estilo "hoja" (bottom sheet) con efecto glass. Se abre, por ejemplo, desde los 3 puntos
// de una conversacion para renombrarla o eliminarla.
export default function HojaAcciones({ visible, titulo, acciones, onCancel }: {
  visible: boolean; titulo?: string; acciones: Accion[]; onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable onPress={onCancel} className="flex-1 bg-black/40 justify-end">
        <Pressable onPress={() => {}} style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="px-3">
          <Glass className="rounded-3xl" intensity={50}>
            {titulo ? <ThemedText className="text-center text-xs opacity-60 pt-3 pb-1 px-4" numberOfLines={1}>{titulo}</ThemedText> : null}
            {acciones.map((a, i) => (
              <Pressable key={i} onPress={a.onPress} className="flex-row items-center px-5 py-4 active:bg-black/10 dark:active:bg-white/10">
                <Icon name={a.icono} size={20} color={a.peligro ? '#ef4444' : undefined} />
                <ThemedText className={`ml-4 text-base ${a.peligro ? 'text-red-500' : ''}`}>{a.etiqueta}</ThemedText>
              </Pressable>
            ))}
          </Glass>
          <Glass className="rounded-3xl mt-2" intensity={50}>
            <Pressable onPress={onCancel} className="px-5 py-4 items-center">
              <ThemedText className="text-base font-semibold">Cancelar</ThemedText>
            </Pressable>
          </Glass>
          <View />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
