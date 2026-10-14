import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import { Button } from '@/components/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { REGEX_CORREO } from '@/lib/reglas';


export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { iniciarSesion } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [errCorreo, setErrCorreo] = useState('');
  const [errPassword, setErrPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const entrar = async () => {
    const okCorreo = REGEX_CORREO.test(correo.trim());
    setErrCorreo(okCorreo ? '' : 'Ingresa un correo valido');
    setErrPassword(password ? '' : 'Ingresa tu contrasena');
    if (!okCorreo || !password) return;
    setCargando(true);
    setError('');
    try {
      await iniciarSesion(correo.trim().toLowerCase(), password); // el AuthGate te lleva a la app
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ThemedScroller style={{ paddingTop: insets.top }} className="pt-20 p-6" keyboardShouldPersistTaps="handled">
      <View className="mt-8">
        <ThemedText className="text-4xl font-outfit-bold mb-14">TalkLate<ThemedText className="text-highlight">.</ThemedText></ThemedText>
        <ThemedText className="text-3xl font-bold mb-1">Hola de nuevo</ThemedText>
        <ThemedText className="text-light-subtext dark:text-dark-subtext mb-10">Inicia sesion para seguir conversando</ThemedText>

        <Input label="Correo" variant="underlined" value={correo} onChangeText={setCorreo} error={errCorreo} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Input label="Contrasena" variant="underlined" value={password} onChangeText={setPassword} error={errPassword} isPassword autoCapitalize="none" onSubmitEditing={entrar} />

        <Link className="underline text-black dark:text-white text-sm mb-4" href="/screens/forgot-password">Olvidaste tu contrasena?</Link>
        {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
        <Button title="Iniciar sesion" onPress={entrar} loading={cargando} size="large" className="mb-6" />

        <View className="flex-row justify-center">
          <ThemedText className="text-light-subtext dark:text-dark-subtext">No tienes cuenta? </ThemedText>
          <Link href="/screens/signup" asChild>
            <Pressable><ThemedText className="underline">Registrate</ThemedText></Pressable>
          </Link>
        </View>
      </View>
    </ThemedScroller>
  );
}
