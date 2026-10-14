import Header, { HeaderIcon } from '@/components/Header';
import ThemeScroller from '@/components/ThemeScroller';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import DrawerButton from '@/components/DrawerButton';
import { shadowPresets } from '@/utils/useShadow';
import { ChatInput } from '@/components/ChatInput';
import { BotSwitch } from '@/components/BotSwitch';
import { CardScroller } from '@/components/CardScroller';
import Rive from 'rive-react-native';

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
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 180}
                style={{ flex: 1 }}
            >
                <View className='flex-1 '>
                    <Header
                        title=""
                        leftComponent={leftComponent}
                        rightComponents={rightComponents}
                    />

                  

                    <View className='flex-1 items-center justify-end'>
                        <CardScroller className='px-global pb-2'>
                            <SuggestionCard title="Make a recipe" description="Find the best recipes for a healthy diet" icon="Cookie" />
                            <SuggestionCard title="Generate image" description="Use text to generate an image" icon="Image" />
                            <SuggestionCard title="Generate text" description="Use an image to generate text" icon="Text" />
                            <SuggestionCard title="Generate code" description="Use text to generate code" icon="Code" />
                        </CardScroller>
                    </View>
                    <ChatInput />


                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const SuggestionCard = (props: any) => {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={{ ...shadowPresets.card }}
            className='p-4 bg-light-primary dark:bg-dark-primary w-[270px] flex flex-row items-center rounded-2xl border border-light-secondary dark:border-dark-secondary'>
            <Icon name={props.icon} size={20} className='bg-light-secondary dark:bg-dark-secondary rounded-full w-12 h-12' />
            <View className='ml-4 flex-1'>
                <ThemedText className='text-lg font-semibold'>{props.title}</ThemedText>
                <ThemedText className='text-sm'>{props.description}</ThemedText>
            </View>
        </TouchableOpacity>
    );
};


export default HomeScreen;