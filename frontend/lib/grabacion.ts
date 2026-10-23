// Grabacion de mensajes de voz con expo-audio (funciona en Expo Go, en Android, iOS y web).
// Mientras graba mide el volumen (metering) para estimar COMO se dijo el mensaje; al terminar entrega
// el audio en base64 listo para POST /conversaciones/:id/mensajes/voz.
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { resumirVolumen } from './reglas';

export type GrabacionVoz = {
  audio_base64: string;
  tipo: string;
  prosodia: { duracion_ms: number; volumen_promedio_db?: number; volumen_max_db?: number; variacion_db?: number };
};

async function aBase64(uri: string): Promise<{ base64: string; tipo: string }> {
  const blob = await (await fetch(uri)).blob();
  const dataUrl: string = await new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onloadend = () => resolver(String(lector.result));
    lector.onerror = () => rechazar(new Error('No pudimos leer el audio grabado.'));
    lector.readAsDataURL(blob);
  });
  const [cabecera, base64] = dataUrl.split(',');
  const tipoBlob = blob.type || (cabecera.match(/^data:([^;]+)/) || [])[1] || '';
  // En el celular el preset graba AAC en .m4a; en web el navegador decide (normalmente audio/webm)
  const tipo = tipoBlob.startsWith('audio/') ? tipoBlob : Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
  return { base64, tipo };
}

export function useGrabadorVoz() {
  const grabador = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const estado = useAudioRecorderState(grabador, 100);
  const muestras = useRef<number[]>([]);
  const inicio = useRef(0);

  useEffect(() => {
    if (estado.isRecording && typeof estado.metering === 'number') muestras.current.push(estado.metering);
  }, [estado.isRecording, estado.metering, estado.durationMillis]);

  async function iniciar() {
    const permiso = await requestRecordingPermissionsAsync();
    if (!permiso.granted) throw new Error('Permite el uso del microfono para poder hablar.');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    muestras.current = [];
    await grabador.prepareToRecordAsync();
    grabador.record();
    inicio.current = Date.now();
  }

  // Detiene la grabacion y devuelve el audio; null si fue demasiado corta (un toque sin hablar)
  async function detener(): Promise<GrabacionVoz | null> {
    await grabador.stop();
    // Volver al modo de reproduccion: en iOS, si queda en modo grabacion la voz sale por el auricular
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const duracion_ms = Date.now() - inicio.current;
    if (!grabador.uri || duracion_ms < 500) return null;
    const { base64, tipo } = await aBase64(grabador.uri);
    return { audio_base64: base64, tipo, prosodia: { duracion_ms, ...(resumirVolumen(muestras.current) || {}) } };
  }

  return { iniciar, detener, grabando: estado.isRecording, nivelDb: estado.metering ?? null, duracionMs: estado.durationMillis };
}
