// Voz: reproduccion de la traduccion (TTS) y dictado (solo web por ahora).
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

const PAIS_A_LOCALE: Record<string, Record<string, string>> = {
  es: { CO: 'es-CO', MX: 'es-MX', ES: 'es-ES', AR: 'es-AR' },
  en: { US: 'en-US', GB: 'en-GB' },
};
const LOCALE_BASE: Record<string, string> = { es: 'es-CO', en: 'en-US', fr: 'fr-FR', pt: 'pt-BR' };

export function localeDe(codigo: string, paisNombre?: string | null): string {
  const iso: Record<string, string> = { Colombia: 'CO', Mexico: 'MX', Espana: 'ES', Argentina: 'AR', 'Estados Unidos': 'US', 'Reino Unido': 'GB' };
  const pais = paisNombre ? iso[paisNombre] : undefined;
  return (pais && PAIS_A_LOCALE[codigo]?.[pais]) || LOCALE_BASE[codigo] || codigo;
}

// La entonacion detectada cambia un poco como suena la voz
const AJUSTE_TONO: Record<string, { pitch: number; rate: number }> = {
  Enojado: { pitch: 0.9, rate: 1.1 },
  Alegre: { pitch: 1.15, rate: 1.05 },
  Amigable: { pitch: 1.08, rate: 1 },
  Preocupado: { pitch: 0.95, rate: 0.95 },
  Formal: { pitch: 1, rate: 0.92 },
  Neutral: { pitch: 1, rate: 1 },
};

export function hablar(texto: string, codigoIdioma: string, paisNombre?: string | null, tono = 'Neutral') {
  const a = AJUSTE_TONO[tono] || AJUSTE_TONO.Neutral;
  Speech.stop();
  Speech.speak(texto, { language: localeDe(codigoIdioma, paisNombre), pitch: a.pitch, rate: a.rate });
}

export const detenerVoz = () => Speech.stop();

// Dictado con la API de reconocimiento del navegador. En celular se usa el microfono del teclado.
export const dictadoDisponible = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export function iniciarDictado(locale: string, alTexto: (texto: string) => void, alTerminar: () => void, alError: (mensaje: string) => void) {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const rec = new Ctor();
  rec.lang = locale;
  rec.interimResults = true;
  rec.continuous = false;
  rec.onresult = (e: any) => {
    let t = '';
    for (let i = 0; i < e.results.length; i += 1) t += e.results[i][0].transcript;
    alTexto(t);
  };
  rec.onerror = (e: any) => alError(e.error === 'not-allowed' ? 'Permite el uso del microfono para poder hablar.' : 'No pudimos escucharte. Intenta de nuevo.');
  rec.onend = alTerminar;
  rec.start();
  return () => rec.stop();
}
