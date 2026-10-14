import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import { Button } from '@/components/Button';
import Selector from '@/components/talklate/Selector';
import { api, Reporte } from '@/lib/api';

const FILTROS = [{ id: 'abierto', etiqueta: 'Abiertos' }, { id: 'revisado', etiqueta: 'Revisados' }, { id: 'descartado', etiqueta: 'Descartados' }];

// Administrador: revisar los reportes de mala traduccion para priorizar mejoras
export default function AdminReportesScreen() {
  const [estado, setEstado] = useState('abierto');
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try { setReportes((await api.reportes(estado)).reportes); setError(''); } catch (e: any) { setError(e.message); }
  }, [estado]);
  useEffect(() => { cargar(); }, [cargar]);

  const resolver = async (id: string, nuevo: 'revisado' | 'descartado') => {
    try { await api.resolverReporte(id, nuevo); await cargar(); } catch (e: any) { setError(e.message); }
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="Reportes de calidad" />
      <ThemedScroller className="pt-2">
        <Selector opciones={FILTROS} seleccion={estado} onChange={setEstado} />
        {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
        {reportes.length === 0 && !error ? <ThemedText className="opacity-60 text-center mt-8">No hay reportes {estado === 'abierto' ? 'abiertos' : estado === 'revisado' ? 'revisados' : 'descartados'}.</ThemedText> : null}
        {reportes.map((r) => (
          <View key={r.id} className="bg-light-secondary dark:bg-dark-secondary rounded-2xl p-4 mb-3">
            <ThemedText className="text-xs opacity-60 mb-2">{r.idioma_origen} → {r.idioma_destino} · {r.reportado_por} · {new Date(r.fecha).toLocaleDateString()}</ThemedText>
            <ThemedText className="text-sm opacity-70">Original</ThemedText>
            <ThemedText className="mb-2">{r.original}</ThemedText>
            <ThemedText className="text-sm opacity-70">Traduccion ({r.motor})</ThemedText>
            <ThemedText className="mb-2 text-highlight">{r.traduccion}</ThemedText>
            <ThemedText className="text-sm opacity-70">Motivo</ThemedText>
            <ThemedText>{r.motivo}</ThemedText>
            {r.sugerencia ? <ThemedText className="text-sm mt-1">Sugerencia: {r.sugerencia}</ThemedText> : null}
            {r.estado === 'abierto' ? (
              <View className="flex-row gap-x-2 mt-3">
                <Button title="Descartar" variant="secondary" size="small" className="flex-1" onPress={() => resolver(r.id, 'descartado')} />
                <Button title="Marcar revisado" size="small" className="flex-1" onPress={() => resolver(r.id, 'revisado')} />
              </View>
            ) : null}
          </View>
        ))}
      </ThemedScroller>
    </View>
  );
}
