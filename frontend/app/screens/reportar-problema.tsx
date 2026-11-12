import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Header from '@/components/Header';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';

const CATEGORIAS = ['Traduccion', 'Voz / Audio', 'Interfaz', 'Cuenta', 'Otro'];

// Reportar un problema general de la app (no es un reporte de traduccion). Envia a POST /problemas.
export default function ReportarProblemaScreen() {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [contacto, setContacto] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    if (descripcion.trim().length < 5) {
      setError('Cuentanos un poco mas sobre el problema (minimo 5 caracteres).');
      return;
    }
    setCargando(true); setError('');
    try {
      await api.reportarProblema({
        descripcion: descripcion.trim(),
        categoria: categoria || undefined,
        contacto: contacto.trim() || undefined,
      });
      setEnviado(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  if (enviado) {
    return (
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <Header showBackButton title="" />
        <ThemedScroller className="pt-10" contentContainerStyle={{ alignItems: 'center' }}>
          <Icon name="CircleCheck" size={56} color="#22c55e" />
          <ThemedText className="text-2xl font-bold mt-4 text-center">Gracias por avisarnos</ThemedText>
          <ThemedText className="text-light-subtext dark:text-dark-subtext mt-2 mb-8 text-center">
            Recibimos tu reporte. Lo revisaremos para mejorar TalkLate.
          </ThemedText>
          <Button title="Volver" size="large" onPress={() => router.back()} />
        </ThemedScroller>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="" />
      <ThemedScroller className="pt-6" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <ThemedText className="text-3xl font-bold mb-1">Reportar un problema</ThemedText>
        <ThemedText className="text-light-subtext dark:text-dark-subtext mb-6">
          Contanos que paso. Entre mas detalle, mejor podemos ayudarte.
        </ThemedText>

        <ThemedText className="font-medium mb-2">Categoria (opcional)</ThemedText>
        <View className="flex-row flex-wrap mb-6">
          {CATEGORIAS.map((c) => {
            const activa = categoria === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCategoria(activa ? null : c)}
                accessibilityRole="button"
                className={`px-4 py-2 mr-2 mb-2 rounded-full border ${activa ? 'bg-highlight border-highlight' : 'border-light-secondary dark:border-dark-secondary'}`}
              >
                <ThemedText className={activa ? 'text-white' : ''}>{c}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Input label="Describe el problema" variant="classic" isMultiline value={descripcion} onChangeText={setDescripcion} maxLength={1000} />
        <Input label="Correo o contacto (opcional)" variant="classic" value={contacto} onChangeText={setContacto} keyboardType="email-address" autoCapitalize="none" maxLength={120} />

        {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
        <Button title="Enviar reporte" size="large" loading={cargando} onPress={enviar} className="mt-2" />
      </ThemedScroller>
    </View>
  );
}
