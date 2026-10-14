import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { validarRegistro } from '@/lib/reglas';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { registrarse } = useAuth();
  const [f, setF] = useState({ nombre: '', apellido: '', correo: '', fecha: '', password: '', acepta: false });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const poner = (k: 'nombre' | 'apellido' | 'correo' | 'fecha' | 'password') => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const crear = async () => {
    // Mismas reglas del servidor (Usuario-RN-2 a RN-4) y consentimiento (Ley 1581 de 2012) para avisar antes de enviar
    const e = validarRegistro(f);
    setErrores(e);
    if (Object.keys(e).length) return;
    setCargando(true);
    setError('');
    try {
      await registrarse({
        nombre: f.nombre.trim(), apellido: f.apellido.trim(), correo: f.correo.trim().toLowerCase(),
        password: f.password, fecha_nacimiento: f.fecha, acepta_tratamiento_datos: f.acepta,
      });
    } catch (err: any) {
      setError(err.message);
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

      <Pressable onPress={() => setF((x) => ({ ...x, acepta: !x.acepta }))} className="flex-row items-start mt-2" accessibilityRole="checkbox" accessibilityState={{ checked: f.acepta }}>
        <View className={`w-5 h-5 rounded border mr-3 mt-0.5 items-center justify-center ${f.acepta ? 'bg-highlight border-highlight' : 'border-neutral-400'}`}>
          {f.acepta ? <Icon name="Check" size={14} color="#fff" /> : null}
        </View>
        <ThemedText className="flex-1 text-sm">
          Acepto la{' '}
          <Link href="/screens/politica-datos"><ThemedText className="text-sm underline">politica de tratamiento de datos</ThemedText></Link>
          {' '}de TalkLate (Ley 1581 de 2012).
        </ThemedText>
      </Pressable>
      {errores.acepta ? <ThemedText className="text-red-500 text-sm mt-1">{errores.acepta}</ThemedText> : null}

      {error ? <ThemedText className="text-red-500 mt-3">{error}</ThemedText> : null}
      <Button title="Crear cuenta" onPress={crear} loading={cargando} size="large" className="mt-6 mb-6" />
      <View className="flex-row justify-center">
        <ThemedText className="text-light-subtext dark:text-dark-subtext">Ya tienes cuenta? </ThemedText>
        <Link href="/screens/login" asChild>
          <Pressable><ThemedText className="underline">Inicia sesion</ThemedText></Pressable>
        </Link>
      </View>
    </ThemedScroller>
  );
}
