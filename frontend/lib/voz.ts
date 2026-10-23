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

// La traduccion sale con la misma entonacion del mensaje: el tono ajusta tono y velocidad de la voz, y
// "ritmo" (1 = normal) imita la velocidad con que hablo la persona en los mensajes de voz.
export function hablar(texto: string, codigoIdioma: string, paisNombre?: string | null, tono = 'Neutral', opciones: { ritmo?: number; alTerminar?: () => void } = {}) {
  const a = AJUSTE_TONO[tono] || AJUSTE_TONO.Neutral;
  const ritmo = opciones.ritmo && Number.isFinite(opciones.ritmo) ? opciones.ritmo : 1;
  Speech.stop();
  Speech.speak(texto, {
    language: localeDe(codigoIdioma, paisNombre),
    pitch: a.pitch,
    rate: Math.min(1.4, Math.max(0.7, a.rate * ritmo)),
    onDone: opciones.alTerminar,
    onStopped: opciones.alTerminar,
    onError: opciones.alTerminar,
  });
}

export const detenerVoz = () => Speech.stop();
