import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import Input from '@/components/forms/Input';
import Switch from '@/components/forms/Switch';
import { Button } from '@/components/Button';
import Selector from '@/components/talklate/Selector';
import { api, Idioma } from '@/lib/api';

// Administrador: activar o desactivar idiomas, y agregar idiomas y regiones al catalogo
export default function AdminIdiomasScreen() {
  const [idiomas, setIdiomas] = useState<Idioma[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [nuevo, setNuevo] = useState({ nombre: '', codigo: '' });
  const [region, setRegion] = useState({ nombre: '', pais: '', paisCodigo: '' });
  const [idiomasRegion, setIdiomasRegion] = useState<string[]>([]);

  const cargar = useCallback(async () => {
    try { setIdiomas((await api.catalogo(true)).idiomas); } catch (e: any) { setError(e.message); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const accion = async (fn: () => Promise<unknown>, mensaje: string) => {
    setError(''); setOk('');
    try { await fn(); setOk(mensaje); await cargar(); } catch (e: any) { setError(e.message); }
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="Idiomas y regiones" />
      <ThemedScroller className="pt-2" keyboardShouldPersistTaps="handled">
        {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
        {ok ? <ThemedText className="text-green-600 mb-3">{ok}</ThemedText> : null}

        <ThemedText className="text-lg font-bold mb-2">Idiomas del catalogo</ThemedText>
        {idiomas.map((i) => (
          <View key={i.id} className="bg-light-secondary dark:bg-dark-secondary rounded-2xl px-4 py-3 mb-3">
            <Switch label={`${i.nombre} (${i.codigo})`} description={i.regiones.length ? i.regiones.map((r) => r.nombre).join(', ') : 'Sin regiones'} value={i.activo} onChange={(v) => accion(() => api.editarIdioma(i.id, { activo: v }), v ? `${i.nombre} activado` : `${i.nombre} desactivado`)} />
          </View>
        ))}

        <ThemedText className="text-lg font-bold mt-6 mb-2">Agregar idioma</ThemedText>
        <Input label="Nombre (ej. Italiano)" variant="underlined" value={nuevo.nombre} onChangeText={(v) => setNuevo((x) => ({ ...x, nombre: v }))} />
        <Input label="Codigo (ej. it)" variant="underlined" value={nuevo.codigo} onChangeText={(v) => setNuevo((x) => ({ ...x, codigo: v }))} autoCapitalize="none" />
        <Button title="Agregar idioma" variant="secondary" className="mb-6" onPress={() => accion(async () => { await api.crearIdioma({ nombre: nuevo.nombre, codigo: nuevo.codigo, activo: false }); setNuevo({ nombre: '', codigo: '' }); }, 'Idioma agregado (queda desactivado hasta que lo actives)')} />

        <ThemedText className="text-lg font-bold mb-2">Agregar region</ThemedText>
        <Input label="Nombre de la region" variant="underlined" value={region.nombre} onChangeText={(v) => setRegion((x) => ({ ...x, nombre: v }))} />
        <Input label="Pais" variant="underlined" value={region.pais} onChangeText={(v) => setRegion((x) => ({ ...x, pais: v }))} />
        <Input label="Codigo del pais (solo si es nuevo, ej. IT)" variant="underlined" value={region.paisCodigo} onChangeText={(v) => setRegion((x) => ({ ...x, paisCodigo: v }))} autoCapitalize="characters" />
        <Selector titulo="Idiomas que se hablan ahi" multiple opciones={idiomas.map((i) => ({ id: i.id, etiqueta: i.nombre }))} seleccion={idiomasRegion} onChange={setIdiomasRegion} />
        <Button title="Agregar region" variant="secondary" onPress={() => accion(async () => { await api.crearRegion({ nombre: region.nombre, pais: region.pais, pais_codigo: region.paisCodigo || undefined, idiomas: idiomasRegion }); setRegion({ nombre: '', pais: '', paisCodigo: '' }); setIdiomasRegion([]); }, 'Region agregada')} />
      </ThemedScroller>
    </View>
  );
}
