import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ResumenConversacion } from '@/lib/api';
import { useAuth } from './AuthContext';

type Ctx = { lista: ResumenConversacion[]; cargando: boolean; refrescar: () => Promise<void> };
const C = createContext<Ctx | undefined>(undefined);

// Mantiene el historial de conversaciones del usuario para el menu lateral y la pantalla de historial
export function ConversacionesProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const [lista, setLista] = useState<ResumenConversacion[]>([]);
  const [cargando, setCargando] = useState(false);

  const refrescar = useCallback(async () => {
    if (!usuario) { setLista([]); return; }
    setCargando(true);
    try {
      setLista((await api.conversaciones()).conversaciones);
    } catch {
      /* el menu sigue mostrando lo ultimo que se cargo */
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => { refrescar(); }, [refrescar]);
  return <C.Provider value={{ lista, cargando, refrescar }}>{children}</C.Provider>;
}

export function useConversaciones() {
  const c = useContext(C);
  if (!c) throw new Error('useConversaciones debe usarse dentro de ConversacionesProvider');
  return c;
}
