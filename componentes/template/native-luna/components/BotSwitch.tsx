import React, { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import ThemedText from "./ThemedText";
import Icon from "./Icon";
import ActionSheetThemed from "./ActionSheetThemed";
import { ActionSheetRef } from "react-native-actions-sheet";

export const BotSwitch = () => {
    const [selectedModel, setSelectedModel] = useState('GPT-4o');
    const actionSheetRef = useRef<ActionSheetRef>(null);
    
    // AI model options
    const modelOptions = [
        { label: 'GPT-4o', value: 'GPT-4o' },
        { label: 'Claude 3', value: 'Claude 3' },
        { label: 'Llama 3', value: 'Llama 3' },
        { label: 'Gemini', value: 'Gemini' }
    ];
    
    // Open the action sheet
    const openModelSelector = () => {
        if (actionSheetRef.current) {
            actionSheetRef.current.show();
        }
    };
    
    // Handle model selection
    const handleModelSelect = (model: string) => {
        setSelectedModel(model);
        if (actionSheetRef.current) {
            actionSheetRef.current.hide();
        }
    };
    
    return (
        <>
            <Pressable 
                className="pl-3 pr-2 py-1 rounded-full flex-row bg-white border border-neutral-300 dark:border-transparent dark:bg-dark-secondary"
                onPress={openModelSelector}
            >
                <ThemedText className="mr-1">{selectedModel}</ThemedText>
                <Icon name="ChevronDown" size={16} className="opacity-50" />
            </Pressable>
            
            {/* ActionSheet for model selection */}
            <ActionSheetThemed ref={actionSheetRef}>
                <View className="p-4">
                    <View className="mb-4">
                        <ThemedText className="text-xl font-semibold mb-2">Select AI Model</ThemedText>
                        <ThemedText className="text-light-subtext dark:text-dark-subtext">Choose the AI model to chat with</ThemedText>
                    </View>
                    
                    {modelOptions.map((option) => (
                        <Pressable 
                            key={option.value}
                            onPress={() => handleModelSelect(option.value)}
                            className={`p-3 mb-2 rounded-lg flex-row justify-between items-center ${selectedModel === option.value ? 'bg-light-primary/10 dark:bg-dark-primary' : ''}`}
                        >
                            <ThemedText className="text-base">{option.label}</ThemedText>
                            {selectedModel === option.value && (
                                <Icon name="Check" size={20} />
                            )}
                        </Pressable>
                    ))}
                    
                    <Pressable 
                        onPress={() => actionSheetRef.current?.hide()}
                        className="mt-4 py-3 bg-light-primary dark:bg-dark-primary rounded-lg items-center"
                    >
                        <ThemedText className="font-semibold">Cancel</ThemedText>
                    </Pressable>
                </View>
            </ActionSheetThemed>
        </>
    )
}