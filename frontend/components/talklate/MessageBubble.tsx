import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { Mensaje } from '@/lib/api';

type Props = {
  mensaje: Mensaje;
  onHablar: (m: Mensaje) => void;
  onReportar: (m: Mensaje) => void;
};

// Un mensaje: lo que dijo la persona, y debajo la traduccion con su nota cultural y acciones
export default function MessageBubble({ mensaje, onHablar, onReportar }: Props) {
  const [verNota, setVerNota] = useState(false);
  const mio = mensaje.remitente === 'usuario';
  const t = mensaje.traduccion;

  return (
    <View className={`mb-5 max-w-[88%] ${mio ? 'self-end items-end' : 'self-start items-start'}`}>
      <View className={`px-4 py-3 rounded-2xl ${mio ? 'bg-black dark:bg-white rounded-br-sm' : 'bg-light-secondary dark:bg-dark-secondary rounded-bl-sm'}`}>
        <Text className={`text-base ${mio ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>{mensaje.contenido}</Text>
      </View>
      <View className="flex-row items-center mt-1 px-1">
        <Icon name={mensaje.canal === 'Voz' ? 'Mic' : 'Keyboard'} size={12} className="mr-1 opacity-60" />
        <ThemedText className="text-xs opacity-60">{mio ? 'Tu' : 'Otra persona'} · {mensaje.tono}</ThemedText>
      </View>

      {t ? (
        <View className="mt-2 rounded-2xl border border-highlight/40 bg-highlight/10 px-4 py-3 w-full">
          <ThemedText className="text-base">{t.contenido}</ThemedText>
          {t.aproximada ? <ThemedText className="text-xs mt-1 opacity-60">Traduccion aproximada: hay palabras que no pudimos traducir.</ThemedText> : null}
          {t.nota_cultural && verNota ? (
            <View className="mt-2 flex-row">
              <Icon name="Lightbulb" size={14} color="#0EA5E9" className="mr-2 mt-0.5" />
              <ThemedText className="flex-1 text-sm opacity-80">{t.nota_cultural}</ThemedText>
            </View>
          ) : null}
          <View className="flex-row items-center mt-2 gap-x-4">
            <Pressable onPress={() => onHablar(mensaje)} className="flex-row items-center" accessibilityLabel="Escuchar traduccion">
              <Icon name="Volume2" size={18} color="#0EA5E9" />
              <ThemedText className="text-xs ml-1">Escuchar</ThemedText>
            </Pressable>
            {t.nota_cultural ? (
              <Pressable onPress={() => setVerNota((v) => !v)} className="flex-row items-center" accessibilityLabel="Ver nota cultural">
                <Icon name="Lightbulb" size={16} color="#0EA5E9" />
                <ThemedText className="text-xs ml-1">{verNota ? 'Ocultar nota' : 'Nota cultural'}</ThemedText>
              </Pressable>
            ) : null}
            <Pressable onPress={() => !t.reportado && onReportar(mensaje)} className="flex-row items-center ml-auto" accessibilityLabel="Reportar mala traduccion">
              <Icon name={t.reportado ? 'Check' : 'Flag'} size={16} className={t.reportado ? '' : 'opacity-70'} />
              <ThemedText className="text-xs ml-1 opacity-70">{t.reportado ? 'Reportado' : 'Reportar'}</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
