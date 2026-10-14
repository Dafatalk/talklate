import React, { useEffect, useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import useThemeColors from '@/app/contexts/ThemeColors';

type Props = {
  visible: boolean;
  titulo: string;
  mensaje?: string;
  valorInicial?: string;
  placeholder?: string;
  confirmar?: string;
  conCampo?: boolean;
  multilinea?: boolean;
  peligro?: boolean;
  secreto?: boolean;
  error?: string;
  onConfirm: (valor: string) => void;
  onCancel: () => void;
};

// Dialogo simple: pide un texto (renombrar, motivo de un reporte) o solo confirma una accion (eliminar)
export default function PromptModal({ visible, titulo, mensaje, valorInicial = '', placeholder, confirmar = 'Aceptar', conCampo = true, multilinea, peligro, secreto, error, onConfirm, onCancel }: Props) {
  const colors = useThemeColors();
  const [valor, setValor] = useState(valorInicial);
  useEffect(() => { if (visible) setValor(valorInicial); }, [visible, valorInicial]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable onPress={onCancel} className="flex-1 bg-black/50 items-center justify-center px-global">
        <Pressable onPress={() => {}} className="w-full max-w-md bg-light-secondary dark:bg-dark-secondary rounded-2xl p-5">
          <ThemedText className="text-lg font-bold mb-1">{titulo}</ThemedText>
          {mensaje ? <ThemedText className="text-light-subtext dark:text-dark-subtext mb-3">{mensaje}</ThemedText> : null}
          {conCampo ? (
            <TextInput
              value={valor}
              onChangeText={setValor}
              placeholder={placeholder}
              placeholderTextColor={colors.placeholder}
              multiline={multilinea}
              secureTextEntry={secreto}
              autoCapitalize={secreto ? 'none' : undefined}
              autoFocus
              style={{ color: colors.text, minHeight: multilinea ? 90 : 44, textAlignVertical: multilinea ? 'top' : 'center' }}
              className="border border-neutral-300 dark:border-neutral-600 rounded-xl px-3 py-2 mb-2"
            />
          ) : null}
          {error ? <ThemedText className="text-red-500 text-sm mb-2">{error}</ThemedText> : null}
          <View className="flex-row gap-x-2 mt-2">
            <Button title="Cancelar" variant="secondary" className="flex-1" onPress={onCancel} />
            <Button
              title={confirmar}
              className={`flex-1 ${peligro ? '!bg-red-500' : ''}`}
              textClassName={peligro ? '!text-white' : ''}
              onPress={() => onConfirm(valor)}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
