import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import DrawerButton from '@/components/DrawerButton';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import { Button } from '@/components/Button';
import SelectField from '@/components/forms/SelectField';
import Flag, { paisDeIdioma } from '@/components/Flag';
import Icon from '@/components/Icon';
import useThemeColors from '@/app/contexts/ThemeColors';
import { api, Catalogo } from '@/lib/api';
import { useConversaciones } from '@/app/contexts/ConversacionesContext';

// Se configura una sola vez: idioma y region de destino (el idioma de origen se reconoce con el primer mensaje)
export default function NuevaConversacion() {
  const { refrescar } = useConversaciones();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
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

  const idiomas = catalogo?.idiomas || [];
  const idiomaDestino = useMemo(() => idiomas.find((i) => i.id === destino), [idiomas, destino]);
  const idiomaOrigen = useMemo(() => idiomas.find((i) => i.id === origen), [idiomas, origen]);

  const opcionesDestino = useMemo(
    () => idiomas.map((i) => ({ id: i.id, etiqueta: i.nombre, pais: paisDeIdioma(i.codigo) })),
    [idiomas],
  );
  const opcionesRegion = useMemo(
    () => (idiomaDestino?.regiones || []).map((r) => ({ id: r.id, etiqueta: r.nombre, sublabel: r.pais.nombre, pais: r.pais.codigo })),
    [idiomaDestino],
  );
  const opcionesOrigen = useMemo(
    () => [
      { id: 'auto', etiqueta: 'Detectar automaticamente', pais: undefined as string | undefined },
      ...idiomas.filter((i) => i.id !== destino).map((i) => ({ id: i.id, etiqueta: i.nombre, pais: paisDeIdioma(i.codigo) })),
    ],
    [idiomas, destino],
  );

  const listo = !!destino && !!region;

  const empezar = async () => {
    if (!listo) { setError('Elige el idioma y la region a los que quieres traducir.'); return; }
    setCreando(true);
    setError('');
    try {
      const conversacion = await api.crearConversacion({
        nombre: nombre.trim() || undefined,
        idioma_destino_id: destino!,
        region_destino_id: region!,
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

      <ThemedScroller className="pt-4" contentContainerStyle={{ paddingBottom: 16 }}>
        <ThemedText className="text-3xl font-outfit-bold mb-1">Nueva conversacion</ThemedText>
        <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">Elige a que idioma y region quieres traducir. Esto se configura una sola vez.</ThemedText>

        <Input label="Nombre (opcional)" variant="underlined" value={nombre} onChangeText={setNombre} />

        <View className="mt-6">
          <SelectField
            label="Traducir a"
            placeholder={catalogo ? 'Elige un idioma' : 'Cargando idiomas...'}
            vacio="No hay idiomas disponibles por ahora."
            opciones={opcionesDestino}
            valor={destino}
            onChange={(id) => { setDestino(id); setRegion(null); }}
          />
          <SelectField
            label="Region del idioma de destino"
            placeholder={idiomaDestino ? 'Elige una region' : 'Primero elige un idioma'}
            disabled={!idiomaDestino}
            vacio="Este idioma no tiene regiones configuradas."
            opciones={opcionesRegion}
            valor={region}
            onChange={setRegion}
          />
          <SelectField
            label="Mi idioma"
            placeholder="Detectar automaticamente"
            opciones={opcionesOrigen}
            valor={origen}
            onChange={setOrigen}
          />
        </View>

        {error ? <ThemedText className="text-red-500 mt-1">{error}</ThemedText> : null}
      </ThemedScroller>

      <View
        className="px-global pt-3 border-t border-light-secondary dark:border-dark-secondary"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        {listo ? (
          <View className="flex-row items-center justify-center mb-3">
            <Flag pais={origen === 'auto' ? undefined : paisDeIdioma(idiomaOrigen?.codigo)} size={16} />
            <ThemedText className="text-sm mx-2" numberOfLines={1}>{origen === 'auto' ? 'Detectar' : idiomaOrigen?.nombre}</ThemedText>
            <Icon name="ArrowRight" size={16} color={colors.text} />
            <View className="ml-2">
              <Flag pais={paisDeIdioma(idiomaDestino?.codigo)} size={16} />
            </View>
            <ThemedText className="text-sm ml-2" numberOfLines={1}>{idiomaDestino?.nombre}</ThemedText>
          </View>
        ) : null}
        <Button title="Empezar a traducir" size="large" loading={creando} disabled={!listo} onPress={empezar} iconEnd="ArrowRight" />
      </View>
    </View>
  );
}
