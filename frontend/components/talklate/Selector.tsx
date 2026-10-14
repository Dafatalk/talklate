import React from 'react';
import { View } from 'react-native';
import { Chip } from '@/components/Chip';
import ThemedText from '@/components/ThemedText';

type Opcion = { id: string; etiqueta: string };
type Props = {
  titulo?: string;
  opciones: Opcion[];
  seleccion: string | string[] | null;
  multiple?: boolean;
  vacio?: string;
  onChange: (valor: any) => void;
};

// Grupo de chips para elegir una (o varias) opciones: idiomas, regiones, filtros
export default function Selector({ titulo, opciones, seleccion, multiple, vacio = 'No hay opciones disponibles.', onChange }: Props) {
  const elegido = (id: string) => (Array.isArray(seleccion) ? seleccion.includes(id) : seleccion === id);
  const tocar = (id: string) => {
    if (multiple) {
      const actual = Array.isArray(seleccion) ? seleccion : [];
      onChange(actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]);
    } else {
      onChange(id);
    }
  };
  return (
    <View className="mb-4">
      {titulo ? <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-2">{titulo}</ThemedText> : null}
      <View className="flex-row flex-wrap gap-2">
        {opciones.length === 0 ? <ThemedText className="opacity-60">{vacio}</ThemedText> : null}
        {opciones.map((o) => (
          <Chip key={o.id} label={o.etiqueta} isSelected={elegido(o.id)} onPress={() => tocar(o.id)} size="lg" />
        ))}
      </View>
    </View>
  );
}
