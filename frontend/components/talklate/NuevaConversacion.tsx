import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Header from '@/components/Header';
import DrawerButton from '@/components/DrawerButton';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import { Button } from '@/components/Button';
import { api, Catalogo } from '@/lib/api';
import { useConversaciones } from '@/app/contexts/ConversacionesContext';
import Selector from './Selector';

// Se configura una sola vez: idioma y region de destino (el idioma de origen se reconoce con el primer mensaje)
export default function NuevaConversacion() {
  const { refrescar } = useConversaciones();
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [nombre, setNombre] = useState('');
  const [destino, setDestino] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [origen, setOrigen] = useState<string>('auto');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    api.catalogo().then(setCatalogo).catch((e) => setError(e.message));
  }, []);

  const idioma = useMemo(() => catalogo?.idiomas.find((i) => i.id === destino), [catalogo, destino]);

  const empezar = async () => {
    if (!destino || !region) { setError('Elige el idioma y la region a los que quieres traducir.'); return; }
    setCreando(true);
    setError('');
    try {
      const { conversacion } = await api.crearConversacion({
        nombre: nombre.trim() || undefined,
        idioma_destino_id: destino,
        region_destino_id: region,
        idioma_origen_id: origen === 'auto' ? undefined : origen,
      });
      await refrescar();
      router.replace({ pathname: '/(drawer)', params: { id: conversacion.id } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreando(false);
    }
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header title="" leftComponent={[<DrawerButton key="menu" />, <ThemedText key="t" className="text-2xl font-outfit-bold ml-4">TalkLate<ThemedText className="text-highlight">.</ThemedText></ThemedText>]} />
      <ThemedScroller className="pt-4">
        <ThemedText className="text-3xl font-outfit-bold mb-1">Nueva conversacion</ThemedText>
        <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">Elige a que idioma y region quieres traducir. Esto se configura una sola vez.</ThemedText>

        <Input label="Nombre (opcional)" variant="underlined" value={nombre} onChangeText={setNombre} />

        <View className="mt-4">
          <Selector
            titulo="Traducir a"
            opciones={(catalogo?.idiomas || []).map((i) => ({ id: i.id, etiqueta: i.nombre }))}
            seleccion={destino}
            vacio={catalogo ? 'No hay idiomas disponibles por ahora.' : 'Cargando idiomas...'}
            onChange={(id: string) => { setDestino(id); setRegion(null); }}
          />
          {idioma ? (
            <Selector
              titulo="Region del idioma de destino"
              opciones={idioma.regiones.map((r) => ({ id: r.id, etiqueta: `${r.nombre} · ${r.pais.nombre}` }))}
              seleccion={region}
              onChange={setRegion}
            />
          ) : null}
          <Selector
            titulo="Mi idioma"
            opciones={[{ id: 'auto', etiqueta: 'Detectar automaticamente' }, ...(catalogo?.idiomas || []).filter((i) => i.id !== destino).map((i) => ({ id: i.id, etiqueta: i.nombre }))]}
            seleccion={origen}
            onChange={setOrigen}
          />
        </View>

        {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
        <Button title="Empezar a traducir" size="large" loading={creando} onPress={empezar} iconEnd="ArrowRight" />
      </ThemedScroller>
    </View>
  );
}
