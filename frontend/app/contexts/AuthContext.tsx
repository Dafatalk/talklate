import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { alSesionExpirada, alSesionRenovada, api, fijarTokens, Sesion, Usuario } from '@/lib/api';

type AuthCtx = {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (correo: string, password: string) => Promise<void>;
  registrarse: (datos: Parameters<typeof api.registro>[0]) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  eliminarCuenta: (password: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);
const CLAVE = 'talklate.sesion';

const guardar = (s: Sesion) => AsyncStorage.setItem(CLAVE, JSON.stringify({ token: s.token, token_refresco: s.token_refresco })).catch(() => {});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const limpiar = useCallback(async () => {
    fijarTokens(null);
    setUsuario(null);
    await AsyncStorage.removeItem(CLAVE).catch(() => {});
  }, []);

  useEffect(() => {
    alSesionExpirada(() => { limpiar(); });
    alSesionRenovada((s) => { guardar(s); setUsuario(s.usuario); });
    (async () => {
      try {
        const guardada = await AsyncStorage.getItem(CLAVE);
        if (guardada) {
          fijarTokens(JSON.parse(guardada));
          setUsuario(await api.yo()); // si el token de acceso vencio, el cliente lo renueva solo
        }
      } catch {
        await limpiar();
      } finally {
        setCargando(false);
      }
    })();
    return () => { alSesionExpirada(null); alSesionRenovada(null); };
  }, [limpiar]);

  const entrar = async (s: Sesion) => {
    fijarTokens({ token: s.token, token_refresco: s.token_refresco });
    await guardar(s);
    setUsuario(s.usuario);
  };

  const value: AuthCtx = {
    usuario,
    cargando,
    iniciarSesion: async (correo, password) => entrar(await api.login(correo, password)),
    registrarse: async (datos) => entrar(await api.registro(datos)),
    cerrarSesion: async () => {
      try { await api.logout(); } catch { /* si ya expiro, igual se limpia */ }
      await limpiar();
    },
    eliminarCuenta: async (password) => {
      await api.eliminarCuenta(password);
      await limpiar();
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return c;
}
