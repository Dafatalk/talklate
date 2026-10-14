import React, { useState } from 'react';
import { Dimensions, FlatList, SafeAreaView, Text, View } from 'react-native';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedText from '@/components/ThemedText';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/Button';

const ancho = Dimensions.get('window').width;
const slides = [
  { id: '1', titulo: 'Traduce lo que quisiste decir', imagen: require('@/assets/lottie/sphere.json'), texto: 'No palabra por palabra: TalkLate cuida el contexto, las emociones y la intencion.' },
  { id: '2', titulo: 'Habla con tu propio estilo', imagen: require('@/assets/lottie/waves.json'), texto: 'Jerga y modismos se cambian por su equivalente cultural en la region de destino.' },
  { id: '3', titulo: 'Guarda y repasa tus conversaciones', imagen: require('@/assets/lottie/speaking.json'), texto: 'Vuelve a tus traducciones para aprender y ganar confianza en otro idioma.' },
];

export default function Bienvenida() {
  const insets = useSafeAreaInsets();
  const [actual, setActual] = useState(0);
  return (
    <SafeAreaView className="flex-1 bg-light-primary dark:bg-dark-primary" style={{ paddingTop: insets.top }}>
      <View className="flex-1">
        <View className="w-full flex-row items-center justify-between px-6 pt-6">
          <ThemedText className="text-2xl font-outfit-bold">TalkLate<ThemedText className="text-highlight">.</ThemedText></ThemedText>
          <ThemeToggle />
        </View>
        <FlatList
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => setActual(Math.round(e.nativeEvent.contentOffset.x / ancho))}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <View style={{ width: ancho }} className="items-center justify-center p-6">
              <LottieView source={item.imagen} autoPlay loop style={{ width: ancho * 0.8, height: 280 }} />
              <ThemedText className="text-2xl mt-4 font-outfit-bold text-center">{item.titulo}</ThemedText>
              <Text className="text-center text-light-subtext dark:text-dark-subtext mt-2">{item.texto}</Text>
            </View>
          )}
        />
        <View className="flex-row justify-center mb-6 w-full">
          {slides.map((s, i) => (
            <View key={s.id} className={`h-2 w-2 mx-1 rounded-full ${i === actual ? 'bg-highlight' : 'bg-light-secondary dark:bg-dark-secondary'}`} />
          ))}
        </View>
        <View className="w-full px-6 mb-global gap-y-3">
          <Button title="Crear cuenta" size="large" rounded="full" onPress={() => router.push('/screens/signup')} />
          <Button title="Iniciar sesion" size="large" rounded="full" variant="outline" onPress={() => router.push('/screens/login')} />
        </View>
      </View>
    </SafeAreaView>
  );
}
