import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { alSesionExpirada, api, fijarToken, Usuario } from '@/lib/api';

type AuthCtx = {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (correo: string, password: string) => Promise<void>;
  registrarse: (datos: Parameters<typeof api.registro>[0]) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);
const CLAVE = 'talklate.token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const limpiar = useCallback(async () => {
    fijarToken(null);
    setUsuario(null);
    await AsyncStorage.removeItem(CLAVE).catch(() => {});
  }, []);

  useEffect(() => {
    alSesionExpirada(() => { limpiar(); });
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE);
        if (guardado) {
          fijarToken(guardado);
          const { usuario: u } = await api.yo();
          setUsuario(u);
        }
      } catch {
        await limpiar();
      } finally {
        setCargando(false);
      }
    })();
    return () => alSesionExpirada(null);
  }, [limpiar]);

  const entrar = async (r: { token: string; usuario: Usuario }) => {
    fijarToken(r.token);
    await AsyncStorage.setItem(CLAVE, r.token);
    setUsuario(r.usuario);
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
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return c;
}
