import Header, { HeaderIcon } from '@/components/Header';
import ThemeScroller from '@/components/ThemeScroller';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import DrawerButton from '@/components/DrawerButton';
import { shadowPresets } from '@/utils/useShadow';
import { ChatInput } from '@/components/ChatInput';
import { BotSwitch } from '@/components/BotSwitch';
import { Sphere } from '@/components/Sphere';
// Types for the chat messages
type MessageType = {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    images?: string[];
};

const HomeScreen = () => {
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [isLoading, setIsLoading] = useState(false);

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
                {/* Main Content */}
                <View style={{ flex: 1 }}>
                    <Header
                        title=""
                        leftComponent={leftComponent}
                        rightComponents={rightComponents}
                    />

                    {messages.length === 0 && !isLoading && (
                        <Sphere />
                    )}

                    {(messages.length > 0 || isLoading) && (
                        <ThemeScroller className="flex-1 px-4 pt-20">
                          

                            {isLoading && (
                                <View className="p-4 my-2 rounded-2xl bg-light-secondary dark:bg-dark-secondary max-w-[80%]">
                                    <View className="flex-row items-center">
                                        <View className="w-2 h-2 bg-highlight rounded-full mx-1" />
                                        <View className="w-2 h-2 bg-highlight rounded-full mx-1" />
                                        <View className="w-2 h-2 bg-highlight rounded-full mx-1" />
                                    </View>
                                </View>
                            )}

                        </ThemeScroller>
                    )}

                    <ChatInput  />


                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

// Helper function to get simulated responses


export default HomeScreen;