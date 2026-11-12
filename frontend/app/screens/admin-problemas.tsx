import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import { Button } from '@/components/Button';
import Selector from '@/components/talklate/Selector';
import { api, Problema } from '@/lib/api';

const FILTROS = [{ id: 'abierto', etiqueta: 'Abiertos' }, { id: 'revisado', etiqueta: 'Revisados' }, { id: 'descartado', etiqueta: 'Descartados' }];

// Administrador: revisar los problemas que reportan los usuarios desde "Reportar un problema"
export default function AdminProblemasScreen() {
  const [estado, setEstado] = useState('abierto');
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try { setProblemas((await api.problemas(estado)).data); setError(''); } catch (e: any) { setError(e.message); }
  }, [estado]);
  useEffect(() => { cargar(); }, [cargar]);

  const resolver = async (id: string, nuevo: 'revisado' | 'descartado') => {
    try { await api.resolverProblema(id, nuevo); await cargar(); } catch (e: any) { setError(e.message); }
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="Problemas reportados" />
      <ThemedScroller className="pt-2">
        <Selector opciones={FILTROS} seleccion={estado} onChange={setEstado} />
        {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
        {problemas.length === 0 && !error ? <ThemedText className="opacity-60 text-center mt-8">No hay problemas {estado === 'abierto' ? 'abiertos' : estado === 'revisado' ? 'revisados' : 'descartados'}.</ThemedText> : null}
        {problemas.map((p) => (
          <View key={p.id} className="bg-light-secondary dark:bg-dark-secondary rounded-2xl p-4 mb-3">
            <ThemedText className="text-xs opacity-60 mb-2">
              {p.categoria ? `${p.categoria} · ` : ''}{p.reportado_por} · {new Date(p.fecha).toLocaleDateString()}
            </ThemedText>
            <ThemedText className="mb-2">{p.descripcion}</ThemedText>
            {p.contacto ? <ThemedText className="text-sm opacity-70">Contacto: {p.contacto}</ThemedText> : null}
            {p.nota_admin ? <ThemedText className="text-sm mt-1">Nota: {p.nota_admin}</ThemedText> : null}
            {p.estado === 'abierto' ? (
              <View className="flex-row gap-x-2 mt-3">
                <Button title="Descartar" variant="secondary" size="small" className="flex-1" onPress={() => resolver(p.id, 'descartado')} />
                <Button title="Marcar revisado" size="small" className="flex-1" onPress={() => resolver(p.id, 'revisado')} />
              </View>
            ) : null}
          </View>
        ))}
      </ThemedScroller>
    </View>
  );
}
