import { Pressable, TouchableOpacity } from "react-native";
import { shadowPresets } from '@/utils/useShadow';
import { View } from "react-native";
import AnimatedView from "./AnimatedView";
import LottieView from 'lottie-react-native';
import { useState } from "react";


export const Sphere = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const toggleSpeaking = () => {
        setIsSpeaking(prev => !prev);
    };
    return (
        <View className='flex-1 items-center justify-center'>
            <AnimatedView
                animation='scaleIn'
                duration={200}
                shouldResetAnimation={true}
            >
                <TouchableOpacity 
                //activeOpacity={0.5}
                className='relative w-[250px] h-[250px] items-center justify-center' onPress={toggleSpeaking}>
                    <View 
                    style={shadowPresets.large}
                    className='w-[140px] relative z-[9999] h-[140px] rounded-full bg-light-secondary dark:bg-dark-primary items-center justify-center'>
                        <LottieView
                            autoPlay
                            style={{
                                width: 250,
                                height: 250,
                                position: 'relative',
                                zIndex: 1000
                            }}
                            source={require('@/assets/lottie/sphere.json')}
                        />
                    </View>
                    {isSpeaking && (
                        <LottieView
                            autoPlay
                            style={{
                                width: 250,
                                height: 250,
                                opacity: 0.4,
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 500
                            }}
                            source={require('@/assets/lottie/speaking.json')}
                        />
                    )}
                </TouchableOpacity>
            </AnimatedView>
        </View>
    )
}