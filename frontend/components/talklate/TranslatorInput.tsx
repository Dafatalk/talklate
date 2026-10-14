import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import useThemeColors from '@/app/contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';
import { dictadoDisponible, iniciarDictado } from '@/lib/voz';

export type EnvioMensaje = { contenido: string; canal: 'texto' | 'voz'; remitente: 'usuario' | 'interlocutor' };
type Props = { enviando: boolean; localeDictado: string; alEnviar: (m: EnvioMensaje) => void; alAvisar: (texto: string) => void };

// Barra para escribir o hablar. "Yo" habla en mi idioma; "Otra persona" responde en el suyo.
export default function TranslatorInput({ enviando, localeDictado, alEnviar, alAvisar }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [voz, setVoz] = useState(false);
  const [remitente, setRemitente] = useState<'usuario' | 'interlocutor'>('usuario');
  const [escuchando, setEscuchando] = useState(false);
  const parar = useRef<null | (() => void)>(null);
  const ultimo = useRef('');
  const entrada = useRef<TextInput>(null);

  useEffect(() => () => parar.current?.(), []);

  const enviar = (contenido: string, canal: 'texto' | 'voz') => {
    const limpio = contenido.trim();
    if (!limpio || enviando) return;
    alEnviar({ contenido: limpio, canal, remitente });
    setTexto('');
    ultimo.current = '';
  };

  const hablar = () => {
    if (escuchando) { parar.current?.(); return; }
    if (!dictadoDisponible()) {
      // En el celular el dictado lo hace el teclado del sistema; el mensaje se envia por el canal de voz
      alAvisar(Platform.OS === 'web' ? 'Este navegador no permite dictado. Prueba con Chrome o escribe tu mensaje.' : 'Toca el microfono del teclado para dictar y luego envia: se entregara por voz.');
      entrada.current?.focus();
      return;
    }
    setEscuchando(true);
    ultimo.current = '';
    parar.current = iniciarDictado(
      localeDictado,
      (t) => { ultimo.current = t; setTexto(t); },
      () => { setEscuchando(false); parar.current = null; if (ultimo.current.trim()) enviar(ultimo.current, 'voz'); },
      (m) => { setEscuchando(false); alAvisar(m); }
    );
  };

  const puedeEnviar = texto.trim().length > 0 && !enviando;

  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 8) }} className="px-global w-full">
      <View className="flex-row items-center mb-2">
        {(['usuario', 'interlocutor'] as const).map((r) => (
          <Pressable key={r} onPress={() => setRemitente(r)} className={`px-3 py-1.5 rounded-full mr-2 ${remitente === r ? 'bg-highlight' : 'bg-light-secondary dark:bg-dark-secondary'}`}>
            <ThemedText className={`text-xs ${remitente === r ? '!text-white' : ''}`}>{r === 'usuario' ? 'Yo' : 'Otra persona'}</ThemedText>
          </Pressable>
        ))}
        <View className="flex-1" />
        <Pressable onPress={() => setVoz((v) => !v)} className="flex-row items-center px-3 py-1.5 rounded-full bg-light-secondary dark:bg-dark-secondary" accessibilityLabel="Cambiar entre texto y voz">
          <Icon name={voz ? 'Mic' : 'Keyboard'} size={14} />
          <ThemedText className="text-xs ml-1">{voz ? 'Modo voz' : 'Modo texto'}</ThemedText>
        </Pressable>
      </View>
      <View style={{ ...shadowPresets.card }} className="flex-row items-end bg-light-secondary dark:bg-dark-secondary rounded-3xl px-4 py-2">
        <TextInput
          ref={entrada}
          value={texto}
          onChangeText={setTexto}
          placeholder={escuchando ? 'Te escucho...' : voz ? 'Habla o dicta tu mensaje' : remitente === 'usuario' ? 'Escribe tu mensaje' : 'Escribe la respuesta de la otra persona'}
          placeholderTextColor={colors.placeholder}
          multiline
          onSubmitEditing={() => enviar(texto, voz ? 'voz' : 'texto')}
          style={{ color: colors.text, flex: 1, maxHeight: 120, minHeight: 40, paddingVertical: 8 }}
        />
        {voz ? (
          <Pressable onPress={hablar} className={`w-10 h-10 rounded-full items-center justify-center ml-2 ${escuchando ? 'bg-red-500' : 'bg-light-primary dark:bg-dark-primary'}`} accessibilityLabel="Hablar">
            <Icon name={escuchando ? 'Square' : 'Mic'} size={18} color={escuchando ? '#fff' : colors.text} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => enviar(texto, voz ? 'voz' : 'texto')}
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
