import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import Icon from './Icon';
import Avatar from './Avatar';
import { useThemeColors } from 'app/contexts/ThemeColors';
import { useNavigation } from 'expo-router';

// As of Expo SDK 56, expo-router bundles its own navigation; this plain action
// replaces the old DrawerActions.openDrawer().
const OPEN_DRAWER = { type: 'OPEN_DRAWER' } as const;

interface DrawerButtonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: ViewStyle;
  isAvatar?: boolean;
}

export default function DrawerButton({
  size = 'md',
  className,
  style,
  isAvatar = false,
}: DrawerButtonProps) {
  const colors = useThemeColors();
  const navigation = useNavigation();

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const handlePress = () => {
    try {
      navigation.dispatch(OPEN_DRAWER);
    } catch (e) {
      console.warn('Drawer navigation context not available:', e);
    }
  };

  return (
    <View className={`rounded-full ${className}`} style={style}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {isAvatar ? (
          <Avatar
            src="https://mighty.tools/mockmind-api/content/human/5.jpg"
            size="xs"
          />
        ) : (
          <Icon name="Menu" size={sizeMap[size]} color={colors.text} />
        )}
      </Pressable>
    </View>
  );
}
