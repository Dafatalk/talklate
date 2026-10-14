import React from 'react';
import { View } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import ThemedScroller from '@/components/ThemeScroller';

// Resumen de la politica de tratamiento de datos (texto completo en requerimientos/politica_tratamiento_datos.md)
const SECCIONES: [string, string][] = [
  ['Que datos guardamos', 'Tu nombre, apellido, correo y fecha de nacimiento, y el contenido de tus conversaciones (mensajes originales y traducidos). Los mensajes se guardan cifrados.'],
  ['Para que', 'Para crear tu cuenta, traducir tus mensajes, guardar tu historial y mejorar la calidad de las traducciones con los reportes que envies. No vendemos tus datos.'],
  ['Quien traduce', 'La traduccion la hace un modelo de inteligencia artificial que corre en el servidor de TalkLate. Si ese modelo no esta disponible, se puede usar un proveedor externo de IA (Anthropic, Claude), que recibe solo el mensaje a traducir.'],
  ['Edad minima', 'Debes tener al menos 13 anos para crear una cuenta.'],
  ['Tus derechos', 'Puedes consultar tus conversaciones, renombrarlas o eliminarlas, y eliminar tu cuenta con todos sus datos desde tu perfil (derecho al olvido). Tambien puedes escribirnos para conocer, actualizar o rectificar tus datos.'],
  ['Responsables', 'Julian David Diaz Medina y Diego Alejandro Franco Atehortua, autores de TalkLate (proyecto academico). Contacto: dafa123.daf@gmail.com.'],
];

export default function PoliticaDatosScreen() {
  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton title="Tratamiento de datos" />
      <ThemedScroller className="pt-2">
        <ThemedText className="text-light-subtext dark:text-dark-subtext mb-4">Politica de tratamiento de datos personales de TalkLate, segun la Ley 1581 de 2012 de Colombia.</ThemedText>
        {SECCIONES.map(([titulo, texto]) => (
          <View key={titulo} className="mb-4">
            <ThemedText className="text-base font-bold mb-1">{titulo}</ThemedText>
            <ThemedText className="opacity-80">{texto}</ThemedText>
          </View>
        ))}
      </ThemedScroller>
    </View>
  );
}
