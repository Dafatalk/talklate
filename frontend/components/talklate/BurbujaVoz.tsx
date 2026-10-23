import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { shadowPresets } from '@/utils/useShadow';
import { Remitente, SelectorRemitente } from './TranslatorInput';

export type EstadoBurbuja = 'lista' | 'escuchando' | 'traduciendo' | 'hablando';
export type UltimoIntercambio = { original: string; traduccion: string; tono: string; remitente: Remitente } | null;

type Props = {
  estado: EstadoBurbuja;
  nivelDb: number | null; // volumen mientras graba (dB entre -160 y 0)
  remitente: Remitente;
  alCambiarRemitente: (r: Remitente) => void;
  alPulsar: () => void;
  ultimo: UltimoIntercambio;
  idiomaUsuario?: string | null;
  idiomaOtro?: string | null;
};

const TEXTO_ESTADO: Record<EstadoBurbuja, string> = {
  lista: 'Toca la burbuja y habla',
  escuchando: 'Te escucho... toca otra vez para traducir',
  traduciendo: 'Traduciendo con tu misma entonacion...',
  hablando: 'Escucha la traduccion (toca para detenerla)',
};

// Modo voz (como el modo de voz de ChatGPT): la burbuja animada del template Luna (AiCircle) representa la IA.
// Al tocarla graba con el microfono; la burbuja late con el volumen de la voz; al tocarla otra vez se
// traduce y la traduccion se escucha con la misma entonacion.
export default function BurbujaVoz({ estado, nivelDb, remitente, alCambiarRemitente, alPulsar, ultimo, idiomaUsuario, idiomaOtro }: Props) {
  const escala = useRef(new Animated.Value(1)).current;
  const pulso = useRef(new Animated.Value(0)).current;

  // La burbuja crece con el volumen mientras escucha
  useEffect(() => {
    const nivel = estado === 'escuchando' && nivelDb !== null ? Math.min(1, Math.max(0, (nivelDb + 60) / 60)) : 0;
    Animated.timing(escala, { toValue: 1 + nivel * 0.18, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [estado, nivelDb, escala]);

  // Pulso suave mientras traduce
  useEffect(() => {
    if (estado !== 'traduciendo') { pulso.stopAnimation(); pulso.setValue(0); return; }
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulso, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulso, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [estado, pulso]);

  const activa = estado === 'escuchando' || estado === 'hablando';
  const icono = estado === 'escuchando' ? 'Square' : estado === 'hablando' ? 'Volume2' : 'Mic';
  const quienHabla = remitente === 'usuario' ? `Hablas tu${idiomaUsuario ? ` (${idiomaUsuario})` : ''}` : `Habla la otra persona${idiomaOtro ? ` (${idiomaOtro})` : ''}`;

  return (
    <View className="flex-1 items-center justify-between px-global pb-6">
      <View className="items-center mt-4">
        <SelectorRemitente remitente={remitente} alCambiar={alCambiarRemitente} />
        <ThemedText className="text-xs opacity-60 mt-2">{quienHabla}</ThemedText>
      </View>

      <View className="items-center">
        <View className="relative w-[260px] h-[260px] items-center justify-center">
          {activa ? (
            <LottieView
              autoPlay
              loop
              style={{ width: 260, height: 260, opacity: estado === 'escuchando' ? 0.45 : 0.3, position: 'absolute', top: 0, left: 0 }}
              source={require('@/assets/lottie/speaking.json')}
            />
          ) : null}
          <Animated.View style={{ transform: [{ scale: escala }], opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) }}>
            <Pressable onPress={alPulsar} disabled={estado === 'traduciendo'} accessibilityRole="button" accessibilityLabel={TEXTO_ESTADO[estado]}>
              <LinearGradient
                colors={['#D883E4', '#016BF0', '#3DE3E0', '#E57DDF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', ...shadowPresets.large }}
              >
                <View className="w-[128px] h-[128px] rounded-full bg-light-secondary dark:bg-dark-primary items-center justify-center">
                  {estado === 'traduciendo' ? <ActivityIndicator size="large" /> : <Icon name={icono} size={38} strokeWidth={1.3} />}
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
        <ThemedText className="text-base mt-2 text-center">{TEXTO_ESTADO[estado]}</ThemedText>
      </View>

      <View className="w-full min-h-[110px]">
        {ultimo ? (
          <View className="w-full rounded-2xl bg-light-secondary dark:bg-dark-secondary p-4">
            <ThemedText className="text-xs opacity-60">{ultimo.remitente === 'usuario' ? 'Dijiste' : 'La otra persona dijo'}</ThemedText>
            <ThemedText className="text-sm mb-2" numberOfLines={2}>{ultimo.original}</ThemedText>
            <ThemedText className="text-xs opacity-60">Traduccion · entonacion {ultimo.tono.toLowerCase()}</ThemedText>
            <ThemedText className="text-lg font-outfit-bold" numberOfLines={3}>{ultimo.traduccion}</ThemedText>
          </View>
        ) : (
          <ThemedText className="text-center opacity-60 text-sm">Habla normal, con tu propio estilo: reconocemos tu entonacion por las palabras y por tu voz, y la traduccion suena igual.</ThemedText>
        )}
      </View>
    </View>
  );
}
