import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/app/contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';

export type Remitente = 'usuario' | 'interlocutor';
export type EnvioMensaje = { contenido: string; canal: 'texto' | 'voz'; remitente: Remitente };
type Props = {
  enviando: boolean;
  remitente: Remitente;
  alCambiarRemitente: (r: Remitente) => void;
  grabando: boolean;
  alPulsarMicrofono: () => void;
  alEnviar: (m: EnvioMensaje) => void;
};

// Selector de quien habla: "Yo" en mi idioma; "Otra persona" responde en el suyo (sin instalar la app)
export function SelectorRemitente({ remitente, alCambiar }: { remitente: Remitente; alCambiar: (r: Remitente) => void }) {
  return (
    <View className="flex-row items-center">
      {(['usuario', 'interlocutor'] as const).map((r) => (
        <Pressable key={r} onPress={() => alCambiar(r)} className={`px-3 py-1.5 rounded-full mr-2 ${remitente === r ? 'bg-highlight' : 'bg-light-secondary dark:bg-dark-secondary'}`}>
          <ThemedText className={`text-xs ${remitente === r ? '!text-white' : ''}`}>{r === 'usuario' ? 'Yo' : 'Otra persona'}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

// Barra del modo chat: escribir y enviar, o tocar el microfono para grabar un mensaje de voz (y otra vez para enviarlo)
export default function TranslatorInput({ enviando, remitente, alCambiarRemitente, grabando, alPulsarMicrofono, alEnviar }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');

  const enviar = () => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    alEnviar({ contenido: limpio, canal: 'texto', remitente });
    setTexto('');
  };

  const puedeEnviar = texto.trim().length > 0 && !enviando;

  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 8) }} className="px-global w-full">
      <View className="mb-2">
        <SelectorRemitente remitente={remitente} alCambiar={alCambiarRemitente} />
      </View>
      {remitente === 'interlocutor' ? (
        <ThemedText className="text-xs opacity-70 mb-2">Pasale el celular a la otra persona: puede hablar o escribir en su idioma, sin instalar la app ni crear cuenta.</ThemedText>
      ) : null}
      <View style={{ ...shadowPresets.card }} className="flex-row items-end bg-light-secondary dark:bg-dark-secondary rounded-3xl px-4 py-2">
        <TextInput
          value={texto}
          onChangeText={setTexto}
          editable={!grabando}
          placeholder={grabando ? 'Te escucho... toca el cuadro para enviar' : remitente === 'usuario' ? 'Escribe tu mensaje' : 'Escribe la respuesta de la otra persona'}
          placeholderTextColor={colors.placeholder}
          multiline
          onSubmitEditing={enviar}
          style={{ color: colors.text, flex: 1, maxHeight: 120, minHeight: 40, paddingVertical: 8 }}
        />
        <Pressable
          onPress={alPulsarMicrofono}
          disabled={enviando && !grabando}
          className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${grabando ? 'bg-red-500' : 'bg-light-primary dark:bg-dark-primary'}`}
          accessibilityLabel={grabando ? 'Enviar mensaje de voz' : 'Hablar'}
        >
          <Icon name={grabando ? 'Square' : 'Mic'} size={18} color={grabando ? '#fff' : colors.text} />
        </Pressable>
        <Pressable
          onPress={enviar}
          disabled={!puedeEnviar}
          className={`w-10 h-10 rounded-full items-center justify-center ml-2 bg-black dark:bg-white ${puedeEnviar ? '' : 'opacity-40'}`}
          accessibilityLabel="Enviar"
        >
          <Icon name={enviando ? 'Loader' : 'Send'} size={17} color={colors.invert} />
        </Pressable>
      </View>
    </View>
  );
}
