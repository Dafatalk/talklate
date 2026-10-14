import Header, { HeaderIcon } from '@/components/Header';
import ThemeScroller from '@/components/ThemeScroller';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import DrawerButton from '@/components/DrawerButton';
import { ChatInput } from '@/components/ChatInput';
import { BotSwitch } from '@/components/BotSwitch';
import { AiCircle } from '@/components/AiCircle';


const HomeScreen = () => {

    const rightComponents = [
        <BotSwitch />
    ];

    const leftComponent = [
        <DrawerButton key="drawer-button" />,
        <ThemedText key="app-title" className='text-2xl font-outfit-bold ml-4'>Luna<Text className="text-highlight">.</Text></ThemedText>
    ];

    return (
        <View className="flex-1 bg-light-primary dark:bg-dark-primary relative">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1 }}>
                    <Header
                        title=""
                        leftComponent={leftComponent}
                        rightComponents={rightComponents} />
                    <View className='flex-1 items-center justify-center relative'>
                        <AiCircle />
                    </View>
                    <ChatInput />


                </View>
                <View className='absolute h-screen w-screen right-0 top-0 items-center justify-center'>

                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default HomeScreen;