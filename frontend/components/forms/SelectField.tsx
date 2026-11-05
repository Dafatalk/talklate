import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import Flag from '@/components/Flag';
import useThemeColors from '@/app/contexts/ThemeColors';

export type OpcionSelect = { id: string; etiqueta: string; sublabel?: string; pais?: string | null };

type Props = {
  label: string;
  opciones: OpcionSelect[];
  valor: string | null;
  placeholder?: string;
  vacio?: string;
  disabled?: boolean;
  onChange: (id: string) => void;
};

// Campo de seleccion que abre un bottom-sheet con la lista (buscable si es larga) y bandera por opcion.
export default function SelectField({
  label,
  opciones,
  valor,
  placeholder = 'Seleccionar',
  vacio = 'No hay opciones disponibles.',
  disabled,
  onChange,
}: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const seleccionada = useMemo(() => opciones.find((o) => o.id === valor) || null, [opciones, valor]);
  const conBusqueda = opciones.length > 8;
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return opciones;
    return opciones.filter((o) => o.etiqueta.toLowerCase().includes(q) || (o.sublabel || '').toLowerCase().includes(q));
  }, [opciones, busqueda]);

  const abrir = () => {
    if (disabled) return;
    setBusqueda('');
    setAbierto(true);
  };
  const elegir = (id: string) => {
    onChange(id);
    setAbierto(false);
  };

  return (
    <View className="mb-5">
      <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-2">{label}</ThemedText>

      <Pressable
        onPress={abrir}
        disabled={disabled}
        className={`flex-row items-center justify-between rounded-2xl px-4 h-14 bg-light-secondary dark:bg-dark-secondary ${disabled ? 'opacity-50' : ''}`}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${seleccionada ? seleccionada.etiqueta : placeholder}`}
      >
        <View className="flex-row items-center flex-1 mr-3">
          {seleccionada ? (
            <>
              <Flag pais={seleccionada.pais} size={20} />
              <View className="ml-3 flex-1">
                <ThemedText className="text-base" numberOfLines={1}>{seleccionada.etiqueta}</ThemedText>
                {seleccionada.sublabel ? (
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext" numberOfLines={1}>{seleccionada.sublabel}</ThemedText>
                ) : null}
              </View>
            </>
          ) : (
            <ThemedText className="text-base text-light-subtext dark:text-dark-subtext" numberOfLines={1}>{placeholder}</ThemedText>
          )}
        </View>
        <Icon name="ChevronDown" size={20} color={colors.text} />
      </Pressable>

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setAbierto(false)}>
          {/* Absorbe el tap sobre el contenido para que no cierre el sheet */}
          <Pressable
            onPress={() => {}}
            className="bg-light-primary dark:bg-dark-primary rounded-t-3xl pt-2"
            style={{ maxHeight: '75%', paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <View className="items-center py-2">
              <View className="w-10 h-1 rounded-full bg-light-secondary dark:bg-dark-secondary" />
            </View>
            <ThemedText className="text-lg font-outfit-bold px-5 mb-3">{label}</ThemedText>

            {conBusqueda ? (
              <View className="mx-5 mb-2 flex-row items-center bg-light-secondary dark:bg-dark-secondary rounded-xl px-3 h-11">
                <Icon name="Search" size={18} color={colors.placeholder} />
                <TextInput
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar"
                  placeholderTextColor={colors.placeholder}
                  style={{ color: colors.text, flex: 1, marginLeft: 8 }}
                  returnKeyType="search"
                />
              </View>
            ) : null}

            {visibles.length === 0 ? (
              <ThemedText className="px-5 py-6 opacity-60">{opciones.length === 0 ? vacio : 'Sin resultados.'}</ThemedText>
            ) : (
              <FlatList
                data={visibles}
                keyExtractor={(o) => o.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const sel = item.id === valor;
                  return (
                    <Pressable
                      onPress={() => elegir(item.id)}
                      className={`flex-row items-center px-5 py-3 ${sel ? 'bg-light-secondary/60 dark:bg-dark-secondary/60' : ''}`}
                    >
                      <Flag pais={item.pais} size={22} />
                      <View className="ml-3 flex-1">
                        <ThemedText className="text-base" numberOfLines={1}>{item.etiqueta}</ThemedText>
                        {item.sublabel ? (
                          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext" numberOfLines={1}>{item.sublabel}</ThemedText>
                        ) : null}
                      </View>
                      {sel ? <Icon name="Check" size={20} color={colors.text} /> : null}
                    </Pressable>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
