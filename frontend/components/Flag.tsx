import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import * as banderas from 'country-flag-icons/string/3x2';
import Icon from '@/components/Icon';
import useThemeColors from '@/app/contexts/ThemeColors';

// Un idioma no es un pais; mapeamos cada idioma a un pais representativo solo para mostrar su bandera.
const PAIS_POR_IDIOMA: Record<string, string> = {
  es: 'ES', en: 'US', pt: 'BR', fr: 'FR', de: 'DE', it: 'IT', ja: 'JP', ko: 'KR',
  zh: 'CN', ru: 'RU', ar: 'SA', hi: 'IN', nl: 'NL', pl: 'PL', tr: 'TR',
};

export function paisDeIdioma(codigoIdioma?: string | null): string | undefined {
  if (!codigoIdioma) return undefined;
  const base = codigoIdioma.toLowerCase().split(/[-_]/)[0];
  return PAIS_POR_IDIOMA[base];
}

type Props = { pais?: string | null; size?: number };

// Bandera SVG offline (country-flag-icons) con fallback a globo cuando no hay pais mapeado.
export default function Flag({ pais, size = 22 }: Props) {
  const colors = useThemeColors();
  const codigo = pais ? pais.toUpperCase() : undefined;
  const ancho = Math.round(size * 1.5);
  const svg = codigo ? (banderas as unknown as Record<string, string>)[codigo] : undefined;

  if (svg) {
    return (
      <View style={{ width: ancho, height: size, borderRadius: 3, overflow: 'hidden' }}>
        <SvgXml xml={svg} width={ancho} height={size} />
      </View>
    );
  }

  return (
    <View
      className="bg-light-secondary dark:bg-dark-secondary items-center justify-center"
      style={{ width: ancho, height: size, borderRadius: 3 }}
    >
      <Icon name="Globe" size={Math.round(size * 0.7)} color={colors.text} />
    </View>
  );
}
