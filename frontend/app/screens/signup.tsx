import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import { Button } from '@/components/Button';
import { useAuth } from '@/app/contexts/AuthContext';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Mismas reglas del servidor (Usuario-RN-2 a RN-4) para avisar antes de enviar
function edad(fecha: string) {
  const f = new Date(fecha + 'T00:00:00');
  const hoy = new Date();
  let e = hoy.getFullYear() - f.getFullYear();
  if (hoy.getMonth() < f.getMonth() || (hoy.getMonth() === f.getMonth() && hoy.getDate() < f.getDate())) e -= 1;
  return e;
}

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { registrarse } = useAuth();
  const [f, setF] = useState({ nombre: '', apellido: '', correo: '', fecha: '', password: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const poner = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const validar = () => {
    const e: Record<string, string> = {};
    if (!f.nombre.trim()) e.nombre = 'Ingresa tu nombre';
    if (!f.apellido.trim()) e.apellido = 'Ingresa tu apellido';
    if (!REGEX_CORREO.test(f.correo.trim())) e.correo = 'El formato del correo es invalido';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fecha) || Number.isNaN(Date.parse(f.fecha))) e.fecha = 'Usa el formato AAAA-MM-DD';
    else if (edad(f.fecha) < 13) e.fecha = 'Debes tener al menos 13 anos para crear una cuenta';
    if (f.password.length < 8 || !/[A-Z]/.test(f.password) || !/[0-9]/.test(f.password) || !/[^A-Za-z0-9]/.test(f.password)) {
      e.password = 'Minimo 8 caracteres, una mayuscula, un numero y un simbolo';
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const crear = async () => {
    if (!validar()) return;
    setCargando(true);
    setError('');
    try {
      await registrarse({ nombre: f.nombre.trim(), apellido: f.apellido.trim(), correo: f.correo.trim().toLowerCase(), password: f.password, fecha_nacimiento: f.fecha });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ThemedScroller style={{ paddingTop: insets.top }} className="pt-12 p-6" keyboardShouldPersistTaps="handled">
      <ThemedText className="text-4xl font-outfit-bold mb-8">TalkLate<ThemedText className="text-highlight">.</ThemedText></ThemedText>
      <ThemedText className="text-3xl font-bold mb-1">Crea tu cuenta</ThemedText>
      <ThemedText className="text-light-subtext dark:text-dark-subtext mb-8">Habla con cualquier persona, en su idioma y con su estilo</ThemedText>

      <Input label="Nombre" variant="underlined" value={f.nombre} onChangeText={poner('nombre')} error={errores.nombre} autoComplete="given-name" />
      <Input label="Apellido" variant="underlined" value={f.apellido} onChangeText={poner('apellido')} error={errores.apellido} autoComplete="family-name" />
      <Input label="Correo" variant="underlined" value={f.correo} onChangeText={poner('correo')} error={errores.correo} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Input label="Fecha de nacimiento (AAAA-MM-DD)" variant="underlined" value={f.fecha} onChangeText={poner('fecha')} error={errores.fecha} autoCapitalize="none" keyboardType="numbers-and-punctuation" />
      <Input label="Contrasena" variant="underlined" value={f.password} onChangeText={poner('password')} error={errores.password} isPassword autoCapitalize="none" />

      {error ? <ThemedText className="text-red-500 mb-3">{error}</ThemedText> : null}
      <Button title="Crear cuenta" onPress={crear} loading={cargando} size="large" className="mt-4 mb-6" />
      <View className="flex-row justify-center">
        <ThemedText className="text-light-subtext dark:text-dark-subtext">Ya tienes cuenta? </ThemedText>
        <Link href="/screens/login" asChild>
          <Pressable><ThemedText className="underline">Inicia sesion</ThemedText></Pressable>
        </Link>
      </View>
    </ThemedScroller>
  );
}
