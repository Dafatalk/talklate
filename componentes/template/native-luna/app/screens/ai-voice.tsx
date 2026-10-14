import React, { useState, useRef } from 'react';
import { View, Modal, TouchableOpacity, ScrollView, Text, Dimensions, Pressable, Animated, Easing } from 'react-native';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import Section from '@/components/layout/Section';
import LottieView from 'lottie-react-native';
import { shadowPresets } from "@/utils/useShadow";
import useThemeColors from '../contexts/ThemeColors';
import { VoiceSelectCard } from '@/components/VoiceSelectCard';

// Add type for VoiceItem props
type VoiceItemProps = {
  name: string;
  description: string;
  isSelected: boolean;
  onSelect: (name: string) => void;
};

export default function AiVoiceScreen() {
  // Add state to track which voice is selected
  const [selectedVoice, setSelectedVoice] = useState("John");

  // Function to handle selection
  const handleSelectVoice = (voiceName: string) => {
    setSelectedVoice(voiceName);
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton
        rightComponents={[
          <Button title="Save" />
        ]}
      />

      <ScrollView className="flex-1 px-global">
        <Section title="Ai Voice" titleSize='3xl' className='py-8 mb-8 pl-3' subtitle="Pick the voice that matches your style" />
        {/*<VoiceItem 
          isSelected={selectedVoice === "John"} 
          name="John" 
          description="Deep and rich tone" 
          onSelect={handleSelectVoice}
        />
        <VoiceItem 
          isSelected={selectedVoice === "Jessica"} 
          name="Jessica" 
          description="Friendly and warm" 
          onSelect={handleSelectVoice}
        />
        <VoiceItem 
          isSelected={selectedVoice === "Larry"} 
          name="Larry" 
          description="British gentleman" 
          onSelect={handleSelectVoice}
        />
        <VoiceItem 
          isSelected={selectedVoice === "Monday"} 
          name="Monday" 
          description="Always annoyed" 
          onSelect={handleSelectVoice}
        />
        <VoiceItem 
          isSelected={selectedVoice === "Tomas"} 
          name="Tomas" 
          description="Chill and relaxed" 
          onSelect={handleSelectVoice}
        />
        <VoiceItem 
          isSelected={selectedVoice === "Jerry"} 
          name="Jerry" 
          description="Sarcastic and funny" 
          onSelect={handleSelectVoice}
        />
        <VoiceItem 
          isSelected={selectedVoice === "Amanda"}
          name="Amanda"
          description="Confident and strong"
          onSelect={handleSelectVoice}        />*/}
        <View className='flex flex-row flex-wrap ' >
          <VoiceSelectCard
            isSelected={selectedVoice === "John"}
            name="John"
            description="Deep and rich tone"
            onSelect={handleSelectVoice}
          />
          <VoiceSelectCard
            isSelected={selectedVoice === "Jessica"}
            name="Jessica"
            description="Friendly and warm"
            onSelect={handleSelectVoice}
          />
          <VoiceSelectCard
            isSelected={selectedVoice === "Larry"}
            name="Larry"
            description="British gentleman"
            onSelect={handleSelectVoice}
          />
          <VoiceSelectCard
            isSelected={selectedVoice === "Monday"}
            name="Monday"
            description="Always annoyed"
            onSelect={handleSelectVoice}
          />
          <VoiceSelectCard
            isSelected={selectedVoice === "Tomas"}
            name="Tomas"
            description="Chill and relaxed"
            onSelect={handleSelectVoice}
          />
          <VoiceSelectCard
            isSelected={selectedVoice === "Jerry"}
            name="Jerry"
            description="Sarcastic and funny"
            onSelect={handleSelectVoice}
          />
        </View>

      </ScrollView>


    </View>
  );
}

const VoiceItem = (props: VoiceItemProps) => {
  const colors = useThemeColors();
  const [isVisible, setIsVisible] = useState(true);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const isSelected = props.isSelected;

  const toggleVisibility = () => {
    const toValue = isVisible ? -20 : -80;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
    setIsVisible(!isVisible);
  };

  // Function to handle the "Use" button click
  const handleUse = () => {
    props.onSelect(props.name);
  };

  return (
    <View className='relative mb-3'>
      <Pressable
        className={`w-full relative z-50 flex-row items-center p-global rounded-2xl ${props.isSelected ? 'bg-teal-300' : 'bg-light-secondary dark:bg-dark-secondary'}`}
        onPress={toggleVisibility}
        style={{ ...shadowPresets.card }}
      >
        <View>
          <Text className={`text-xl font-outfit-bold ${props.isSelected ? 'text-black dark:text-black' : 'text-black dark:text-white'}`}>{props.name}</Text>
          <Text className={`text-sm opacity-70 ${props.isSelected ? 'text-black dark:text-black' : 'text-black dark:text-white'}`}>{props.description}</Text>
        </View>
        <View className='items-center justify-center ml-auto'>
          <Icon name={isVisible ? "Play" : "Pause"} size={20} color={isSelected ? colors.invert : colors.icon} />
        </View>
      </Pressable>
      <Animated.View
        style={{ marginTop: slideAnim }}
        className='w-full relative pb-3 px-0 pt-8 flex-row items-end overflow-hidden rounded-2xl bg-light-secondary dark:bg-dark-darker'
      >
        <LottieView
          autoPlay
          style={{
            width: '80%',
            height: 45,
            position: 'absolute', left: -5, bottom: 5, zIndex: 40
          }}
          source={require('@/assets/lottie/waves.json')}
        />
        <View
          className='flex-row items-center justify-end w-full relative z-50 pr-global'>
          <Button
            title="Use"
            size='small'
            className='bg-dark-primary dark:bg-light-primary'
            textClassName='text-white dark:text-black'
            variant='secondary'
            onPress={handleUse}
          />
        </View>
      </Animated.View>
    </View>
  )
}

