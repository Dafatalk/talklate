// Cliente del API de TalkLate (backend/). Todos los textos de error vienen ya en espanol desde el servidor.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type Rol = 'cliente' | 'admin';
export type Usuario = { id: string; nombre: string; apellido: string; correo: string; fecha_nacimiento: string; rol: Rol };
export type Pais = { id: string; nombre: string; codigo: string };
export type Region = { id: string; nombre: string; pais: Pais };
export type Idioma = { id: string; nombre: string; codigo: string; activo: boolean; regiones: Region[] };
export type Catalogo = { idiomas: Idioma[]; entonaciones: { id: string; nombre: string }[]; canales: { id: string; nombre: string }[] };

export type ConfigIdioma = { lenguaje_conversacion_id: string; idioma_id: string; idioma: string; codigo: string; region_id: string | null; region: string | null; pais: string | null };
export type Configuracion = { origen: ConfigIdioma | null; destino: ConfigIdioma };
export type ResumenConversacion = {
  id: string;
  nombre: string;
  fecha_inicio: string;
  configuracion: Configuracion;
  total_mensajes: number;
  ultimo_mensaje: { contenido: string; traduccion: string | null; fecha: string } | null;
};
export type Traduccion = { id: string; contenido: string; nota_cultural: string | null; aproximada: boolean; motor: string; estado_entrega: string; reportado: boolean };
export type Mensaje = { id: string; remitente: 'usuario' | 'interlocutor'; canal: 'Texto' | 'Voz'; tono: string; contenido: string; fecha: string; traduccion: Traduccion | null };
export type RespuestaMensaje = {
  mensaje: Mensaje;
  entrega: { canal: 'Texto' | 'Voz'; reproducir_audio: boolean; idioma_codigo: string; region_origen_detectada: string | null };
  configuracion: Configuracion;
  aviso: string | null;
};
export type Reporte = {
  id: string; motivo: string; sugerencia: string | null; estado: 'abierto' | 'revisado' | 'descartado'; nota_admin: string | null; fecha: string;
  original: string; traduccion: string; nota_cultural: string | null; motor: string; idioma_origen: string; idioma_destino: string; reportado_por: string;
};

export class ApiError extends Error {
  estado: number;
  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.estado = estado;
  }
}

export function apiBase(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    return `http://${host}:3000/api`;
  }
  // En Expo Go el host del computador de desarrollo viene en hostUri (ej. 192.168.1.5:8081)
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:3000/api`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
}

let token: string | null = null;
let alExpirar: (() => void) | null = null;
export const fijarToken = (t: string | null) => { token = t; };
export const alSesionExpirada = (fn: (() => void) | null) => { alExpirar = fn; };

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(apiBase() + ruta, {
      method: metodo,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor de TalkLate. Revisa tu conexion e intenta de nuevo.');
  }
  let datos: any = null;
  try { datos = await resp.json(); } catch { /* respuesta sin cuerpo */ }
  if (!resp.ok) {
    if (resp.status === 401 && token && alExpirar) alExpirar();
    throw new ApiError(resp.status, (datos && datos.error) || 'Ocurrio un error inesperado. Intenta de nuevo.');
  }
  return datos as T;
}

export const api = {
  registro: (b: { nombre: string; apellido: string; correo: string; password: string; fecha_nacimiento: string }) =>
    pedir<{ token: string; usuario: Usuario }>('POST', '/auth/registro', b),
  login: (correo: string, password: string) => pedir<{ token: string; usuario: Usuario }>('POST', '/auth/login', { correo, password }),
  recuperar: (correo: string) => pedir<{ mensaje: string; codigo_dev?: string }>('POST', '/auth/recuperar', { correo }),
  restablecer: (correo: string, codigo: string, password: string) => pedir<{ mensaje: string }>('POST', '/auth/restablecer', { correo, codigo, password }),
  logout: () => pedir<{ mensaje: string }>('POST', '/auth/logout'),
  yo: () => pedir<{ usuario: Usuario }>('GET', '/auth/yo'),

  catalogo: (todos = false) => pedir<Catalogo>('GET', `/catalogo${todos ? '?todos=1' : ''}`),
  crearIdioma: (b: { nombre: string; codigo: string; activo: boolean }) => pedir<{ idioma: Idioma }>('POST', '/admin/idiomas', b),
  editarIdioma: (id: string, b: { nombre?: string; activo?: boolean; regiones?: string[] }) => pedir<{ idioma: Idioma }>('PATCH', `/admin/idiomas/${id}`, b),
  crearRegion: (b: { nombre: string; pais: string; pais_codigo?: string; idiomas: string[] }) => pedir<{ region: { id: string } }>('POST', '/admin/regiones', b),

  conversaciones: () => pedir<{ conversaciones: ResumenConversacion[] }>('GET', '/conversaciones'),
  conversacion: (id: string) => pedir<{ conversacion: ResumenConversacion; mensajes: Mensaje[] }>('GET', `/conversaciones/${id}`),
  crearConversacion: (b: { nombre?: string; idioma_destino_id: string; region_destino_id: string; idioma_origen_id?: string }) =>
    pedir<{ conversacion: ResumenConversacion }>('POST', '/conversaciones', b),
  renombrar: (id: string, nombre: string) => pedir<{ conversacion: ResumenConversacion }>('PATCH', `/conversaciones/${id}`, { nombre }),
  eliminar: (id: string) => pedir<{ mensaje: string }>('DELETE', `/conversaciones/${id}`),
  enviarMensaje: (id: string, b: { contenido: string; canal: 'texto' | 'voz'; remitente: 'usuario' | 'interlocutor'; idioma_origen_id?: string }) =>
    pedir<RespuestaMensaje>('POST', `/conversaciones/${id}/mensajes`, b),

  reportar: (destinoId: string, motivo: string, sugerencia?: string) => pedir<{ mensaje: string }>('POST', `/mensajes/${destinoId}/reportar`, { motivo, sugerencia }),
  reportes: (estado?: string) => pedir<{ reportes: Reporte[] }>('GET', `/admin/reportes${estado ? `?estado=${estado}` : ''}`),
  resolverReporte: (id: string, estado: 'abierto' | 'revisado' | 'descartado', nota_admin?: string) => pedir<{ mensaje: string }>('PATCH', `/admin/reportes/${id}`, { estado, nota_admin }),
};
