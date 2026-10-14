import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Header from '@/components/Header';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';

// Paso 1: pedir el codigo al correo. Paso 2: usar el codigo y definir una nueva contrasena.
export default function ForgotPasswordScreen() {
  const [paso, setPaso] = useState<1 | 2>(1);
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const pedirCodigo = async () => {
    setCargando(true); setError('');
    try {
      const r = await api.recuperar(correo.trim().toLowerCase());
      // En desarrollo el servidor devuelve el codigo para poder probar sin servicio de correo
      if (r.codigo_dev) setCodigo(r.codigo_dev);
      setInfo(r.codigo_dev ? `${r.mensaje} (Modo desarrollo: codigo ${r.codigo_dev})` : r.mensaje);
      setPaso(2);
    } catch (e: any) { setError(e.message); } finally { setCargando(false); }
  };

  const restablecer = async () => {
    setCargando(true); setError('');
    try {
      await api.restablecer(correo.trim().toLowerCase(), codigo.trim(), password);
      router.replace('/screens/login');
    } catch (e: any) { setError(e.message); } finally { setCargando(false); }
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="" />
      <ThemedScroller className="pt-6" keyboardShouldPersistTaps="handled">
        <ThemedText className="text-3xl font-bold mb-1">{paso === 1 ? 'Recupera tu cuenta' : 'Nueva contrasena'}</ThemedText>
        <ThemedText className="text-light-subtext dark:text-dark-subtext mb-8">
          {paso === 1 ? 'Te enviaremos un codigo a tu correo' : 'Escribe el codigo que recibiste y tu nueva contrasena'}
        </ThemedText>
        <Input label="Correo" variant="underlined" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" editable={paso === 1} />
        {paso === 2 ? (
          <>
            {info ? <ThemedText className="text-sm text-highlight mb-3">{info}</ThemedText> : null}
            <Input label="Codigo de 6 digitos" variant="underlined" value={codigo} onChangeText={setCodigo} keyboardType="number-pad" />
            <Input label="Nueva contrasena" variant="underlined" value={password} onChangeText={setPassword} isPassword autoCapitalize="none" />
          </>
        ) : null}
        {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
        <Button title={paso === 1 ? 'Enviar codigo' : 'Cambiar contrasena'} onPress={paso === 1 ? pedirCodigo : restablecer} loading={cargando} size="large" className="mt-4" />
        {paso === 2 ? <Button title="Pedir otro codigo" variant="ghost" className="mt-2" onPress={() => { setPaso(1); setInfo(''); }} /> : null}
      </ThemedScroller>
    </View>
  );
}
