// Voz de salida de la traduccion. Primero intenta la voz natural del servidor (voces neuronales con
// emocion real: enojo, alegria, tristeza; ADR-015) y si no esta configurada usa la voz del celular
// (expo-speech) ajustando tono y velocidad segun la entonacion.
import * as Speech from 'expo-speech';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { api } from './api';

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

// Respaldo con la voz del celular: la entonacion cambia un poco como suena
const AJUSTE_TONO: Record<string, { pitch: number; rate: number }> = {
  Enojado: { pitch: 0.85, rate: 1.15 },
  Alegre: { pitch: 1.2, rate: 1.08 },
  Amigable: { pitch: 1.08, rate: 1 },
  Preocupado: { pitch: 0.9, rate: 0.9 },
  Formal: { pitch: 1, rate: 0.92 },
  Neutral: { pitch: 1, rate: 1 },
};

let reproductor: AudioPlayer | null = null;
let alTerminarActual: (() => void) | undefined;
// Cada reproduccion tiene su numero: un aviso tardio de una voz anterior no termina la actual
let turno = 0;
// Si el servidor dice que no hay voz natural, no se le vuelve a preguntar en un rato
let sinVozNaturalHasta = 0;

function terminar(de = turno) {
  if (de !== turno) return;
  const fn = alTerminarActual;
  alTerminarActual = undefined;
  fn?.();
}

function hablarCelular(texto: string, codigo: string, pais: string | null | undefined, tono: string, ritmo: number) {
  const mio = turno;
  const fin = () => terminar(mio);
  const a = AJUSTE_TONO[tono] || AJUSTE_TONO.Neutral;
  Speech.speak(texto, {
    language: localeDe(codigo, pais),
    pitch: a.pitch,
    rate: Math.min(1.4, Math.max(0.7, a.rate * ritmo)),
    onDone: fin,
    onStopped: fin,
    onError: fin,
  });
}

async function hablarNatural(texto: string, codigo: string, pais: string | null | undefined, tono: string, ritmo: number): Promise<boolean> {
  if (Date.now() < sinVozNaturalHasta) return false;
  const mio = turno;
  try {
    const { url } = await api.sintetizarVoz({ texto, idioma: codigo, pais, tono, ritmo });
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (mio !== turno) return true; // la detuvieron mientras se generaba el audio
    const p = createAudioPlayer({ uri: url });
    reproductor = p;
    p.addListener('playbackStatusUpdate', (estado) => {
      if (estado.didJustFinish) { p.remove(); if (reproductor === p) reproductor = null; terminar(mio); }
    });
    p.play();
    return true;
  } catch (e: any) {
    if (e && e.estado === 503) sinVozNaturalHasta = Date.now() + 5 * 60 * 1000;
    return false;
  }
}

// La traduccion sale con la misma entonacion del mensaje; "ritmo" (1 = normal) imita la velocidad
// con que hablo la persona en los mensajes de voz. alTerminar se llama una sola vez al acabar.
export async function hablar(texto: string, codigoIdioma: string, paisNombre?: string | null, tono = 'Neutral', opciones: { ritmo?: number; alTerminar?: () => void } = {}) {
  detenerVoz();
  turno += 1;
  alTerminarActual = opciones.alTerminar;
  const ritmo = opciones.ritmo && Number.isFinite(opciones.ritmo) ? opciones.ritmo : 1;
  if (!(await hablarNatural(texto, codigoIdioma, paisNombre, tono, ritmo))) hablarCelular(texto, codigoIdioma, paisNombre, tono, ritmo);
}

export function detenerVoz() {
  if (reproductor) { try { reproductor.pause(); reproductor.remove(); } catch { /* ya liberado */ } reproductor = null; }
  Speech.stop();
  terminar();
  turno += 1;
}
