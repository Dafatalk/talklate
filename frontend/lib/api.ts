// Cliente del API de TalkLate (backend/, base /api/v1). Los mensajes de error vienen en espanol desde el servidor.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type Rol = 'cliente' | 'admin';
export type Usuario = { id: string; nombre: string; apellido: string; correo: string; fecha_nacimiento: string; rol: Rol };
export type Sesion = { token: string; token_refresco: string; expira_en: number; usuario: Usuario };
export type Pais = { id: string; nombre: string; codigo: string };
export type Region = { id: string; nombre: string; pais: Pais };
export type Idioma = { id: string; nombre: string; codigo: string; activo: boolean; regiones: Region[] };
export type Catalogo = { idiomas: Idioma[]; entonaciones: { id: string; nombre: string }[]; canales: { id: string; nombre: string }[] };
export type Pagina<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

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
export type ConversacionCompleta = ResumenConversacion & { mensajes: Mensaje[] };
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
    return `http://${host}:3000/api/v1`;
  }
  // En Expo Go el host del computador de desarrollo viene en hostUri (ej. 192.168.1.5:8081)
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:3000/api/v1`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/v1' : 'http://localhost:3000/api/v1';
}

// Tokens de la sesion: el de acceso dura poco; con el de refresco se pide uno nuevo sin volver a iniciar sesion
let tokens: { token: string; token_refresco: string } | null = null;
let alExpirar: (() => void) | null = null;
let alRenovar: ((s: Sesion) => void) | null = null;
export const fijarTokens = (t: { token: string; token_refresco: string } | null) => { tokens = t; };
export const tokenRefresco = () => tokens?.token_refresco || null;
export const alSesionExpirada = (fn: (() => void) | null) => { alExpirar = fn; };
export const alSesionRenovada = (fn: ((s: Sesion) => void) | null) => { alRenovar = fn; };

let renovando: Promise<boolean> | null = null;
async function renovar(): Promise<boolean> {
  if (!tokens?.token_refresco) return false;
  if (!renovando) {
    renovando = (async () => {
      try {
        const r = await fetch(apiBase() + '/auth/refrescar', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token_refresco: tokens?.token_refresco }),
        });
        if (!r.ok) return false;
        const s = (await r.json()) as Sesion;
        tokens = { token: s.token, token_refresco: s.token_refresco };
        alRenovar?.(s);
        return true;
      } catch {
        return false;
      } finally {
        setTimeout(() => { renovando = null; }, 0);
      }
    })();
  }
  return renovando;
}

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown, reintento = true): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(apiBase() + ruta, {
      method: metodo,
      headers: { 'content-type': 'application/json', ...(tokens ? { authorization: `Bearer ${tokens.token}` } : {}) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor de TalkLate. Revisa tu conexion e intenta de nuevo.');
  }
  // Token de acceso vencido: se renueva una vez y se repite la peticion
  if (resp.status === 401 && tokens && reintento && !ruta.startsWith('/auth/')) {
    if (await renovar()) return pedir<T>(metodo, ruta, cuerpo, false);
    alExpirar?.();
  }
  let datos: any = null;
  if (resp.status !== 204) {
    try { datos = await resp.json(); } catch { /* respuesta sin cuerpo */ }
  }
  if (!resp.ok) {
    throw new ApiError(resp.status, (datos && datos.message) || 'Ocurrio un error inesperado. Intenta de nuevo.');
  }
  return datos as T;
}

export const api = {
  registro: (b: { nombre: string; apellido: string; correo: string; password: string; fecha_nacimiento: string; acepta_tratamiento_datos: boolean }) =>
    pedir<Sesion>('POST', '/auth/registro', b),
  login: (correo: string, password: string) => pedir<Sesion>('POST', '/auth/login', { correo, password }),
  recuperar: (correo: string) => pedir<{ mensaje: string; codigo_dev?: string }>('POST', '/auth/recuperar', { correo }),
  restablecer: (correo: string, codigo: string, password: string) => pedir<{ mensaje: string }>('POST', '/auth/restablecer', { correo, codigo, password }),
  logout: () => pedir<null>('POST', '/auth/logout', { token_refresco: tokenRefresco() }),
  yo: () => pedir<Usuario>('GET', '/usuarios/yo'),
  eliminarCuenta: (password: string) => pedir<null>('DELETE', '/usuarios/yo', { password }),

  catalogo: (todos = false) => pedir<Catalogo>('GET', `/catalogo${todos ? '?todos=1' : ''}`),
  crearIdioma: (b: { nombre: string; codigo: string; activo: boolean }) => pedir<Idioma>('POST', '/admin/idiomas', b),
  editarIdioma: (id: string, b: { nombre?: string; activo?: boolean; regiones?: string[] }) => pedir<Idioma>('PATCH', `/admin/idiomas/${id}`, b),
  crearRegion: (b: { nombre: string; pais: string; pais_codigo?: string; idiomas: string[] }) => pedir<{ id: string }>('POST', '/admin/regiones', b),

  conversaciones: () => pedir<Pagina<ResumenConversacion>>('GET', '/conversaciones?limit=100'),
  conversacion: (id: string) => pedir<ConversacionCompleta>('GET', `/conversaciones/${id}`),
  crearConversacion: (b: { nombre?: string; idioma_destino_id: string; region_destino_id: string; idioma_origen_id?: string }) =>
    pedir<ResumenConversacion>('POST', '/conversaciones', b),
  renombrar: (id: string, nombre: string) => pedir<ResumenConversacion>('PATCH', `/conversaciones/${id}`, { nombre }),
  eliminar: (id: string) => pedir<null>('DELETE', `/conversaciones/${id}`),
  enviarMensaje: (id: string, b: { contenido: string; canal: 'texto' | 'voz'; remitente: 'usuario' | 'interlocutor'; idioma_origen_id?: string }) =>
    pedir<RespuestaMensaje>('POST', `/conversaciones/${id}/mensajes`, b),

  reportar: (destinoId: string, motivo: string, sugerencia?: string) =>
    pedir<{ id: string; mensaje: string }>('POST', '/reportes', { mensaje_destino_id: destinoId, motivo, sugerencia }),
  reportes: (estado?: string) => pedir<Pagina<Reporte>>('GET', `/admin/reportes?limit=100${estado ? `&estado=${estado}` : ''}`),
  resolverReporte: (id: string, estado: 'abierto' | 'revisado' | 'descartado', nota_admin?: string) => pedir<Reporte>('PATCH', `/admin/reportes/${id}`, { estado, nota_admin }),
};
