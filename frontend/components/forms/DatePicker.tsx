import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Platform, Animated, Pressable, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeColors } from '@/app/contexts/ThemeColors';
import { formatToYYYYMMDD } from '@/utils/date';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { InputVariant } from './Input';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  error?: string;
  containerClassName?: string;
  variant?: InputVariant;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Selecciona una fecha',
  maxDate,
  minDate,
  error,
  containerClassName = '',
  variant = 'animated',
}) => {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());
  const [isFocused, setIsFocused] = useState(false);
  const colors = useThemeColors();
  const animatedLabelValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    if (variant !== 'classic') {
      Animated.timing(animatedLabelValue, {
        toValue: (isFocused || value) ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isFocused, value, animatedLabelValue, variant]);

  const labelStyle = {
    top: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.placeholder, colors.text],
    }),
    left: 12,
    paddingHorizontal: 8,
  };

  const underlinedLabelStyle = {
    top: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.placeholder, colors.text],
    }),
    left: 0,
    paddingHorizontal: 0,
  };

  const showDatePicker = () => {
    setIsFocused(true);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setIsFocused(false);
    setDatePickerVisible(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      hideDatePicker();
      if (selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    hideDatePicker();
  };

  // Renderiza el selector: en iOS va dentro de un modal inferior con botones; en Android usa el dialogo nativo.
  const renderDatePicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <Modal
          visible={isDatePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={hideDatePicker}
        >
          <Pressable
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
            onPress={hideDatePicker}
          >
            {/* Absorbe el tap sobre el contenido para que no cierre el modal */}
            <Pressable onPress={() => {}}>
              <View className="bg-light-primary dark:bg-dark-primary rounded-t-xl items-center justify-center w-full">
                <View className="flex-row justify-between items-center p-4 border-b border-light-secondary dark:border-dark-secondary w-full">
                  <Button
                    title="Cancelar"
                    variant="ghost"
                    onPress={hideDatePicker}
                    textClassName="text-base font-normal"
                  />
                  <ThemedText className="text-lg font-medium">
                    {label || 'Selecciona una fecha'}
                  </ThemedText>
                  <Button
                    title="Listo"
                    variant="ghost"
                    onPress={handleConfirm}
                    textClassName="text-base font-semibold"
                  />
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={maxDate}
                  minimumDate={minDate}
                  themeVariant={colors.isDark ? 'dark' : 'light'}
                  style={{ backgroundColor: colors.bg }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      );
    } else {
      return isDatePickerVisible && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      );
    }
  };

  // Variante classic (sin animacion)
  if (variant === 'classic') {
    return (
      <View className={`mb-global ${containerClassName}`}>
        {label && (
          <ThemedText className="mb-1 font-medium">{label}</ThemedText>
        )}
        <View className="relative">
          <TouchableOpacity
            onPress={showDatePicker}
            className={`border rounded-lg py-4 px-3 h-14 pr-10 text-black dark:text-white bg-transparent
              ${isFocused ? 'border-black dark:border-white' : 'border-black/60 dark:border-white/60'}
              ${error ? 'border-red-500' : ''}`}
          >
            <ThemedText className={value ? 'text-base' : 'text-base text-gray-500'}>
              {value ? formatToYYYYMMDD(value) : placeholder}
            </ThemedText>
          </TouchableOpacity>
          <Pressable className="absolute right-3 top-[18px] z-10">
            <Icon name="Calendar" size={20} color={colors.text} />
          </Pressable>
        </View>
        {error && (
          <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
        )}
        {renderDatePicker()}
      </View>
    );
  }

  // Variante underlined
  if (variant === 'underlined') {
    return (
      <View className={`mb-global ${containerClassName}`}>
        <View className="relative">
          <Pressable className='px-0 bg-light-primary dark:bg-dark-primary z-40' onPress={showDatePicker}>
            <Animated.Text
              style={[underlinedLabelStyle]}
              className="absolute z-50 bg-light-primary dark:bg-dark-primary text-black dark:text-white"
            >
              {label}
            </Animated.Text>
          </Pressable>
          <TouchableOpacity
            onPress={showDatePicker}
            className={`border-b-2 py-4 px-0 h-14 pr-10 text-black dark:text-white bg-transparent border-t-0 border-l-0 border-r-0
              ${isFocused ? 'border-black dark:border-white' : 'border-black/60 dark:border-white/60'}
              ${error ? 'border-red-500' : ''}`}
          >
            <ThemedText className={value ? 'text-base' : 'text-base text-gray-500'}>
              {value ? formatToYYYYMMDD(value) : ''}
            </ThemedText>
          </TouchableOpacity>
          <Pressable className="absolute right-0 top-[18px] z-10">
            <Icon name="Calendar" size={20} color={colors.text} />
          </Pressable>
        </View>
        {error && (
          <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
        )}
        {renderDatePicker()}
      </View>
    );
  }

  // Variante animated (por defecto)
  return (
    <View className={`mb-global ${containerClassName}`}>
      <View className="relative">
        <Pressable className='px-1 bg-light-primary dark:bg-dark-primary z-40' onPress={showDatePicker}>
          <Animated.Text
            style={[labelStyle]}
            className="absolute z-50 px-1 bg-light-primary dark:bg-dark-primary text-black dark:text-white"
          >
            {label}
          </Animated.Text>
        </Pressable>
        <TouchableOpacity
          onPress={showDatePicker}
          className={`border rounded-lg py-4 px-3 h-14 pr-10 text-black dark:text-white bg-transparent
            ${isFocused ? 'border-black dark:border-white' : 'border-black/60 dark:border-white/60'}
            ${error ? 'border-red-500' : ''}`}
        >
          <ThemedText className={value ? 'text-base' : 'text-base text-gray-500'}>
            {value ? formatToYYYYMMDD(value) : ''}
          </ThemedText>
        </TouchableOpacity>
        <Pressable className="absolute right-3 top-[18px] z-10">
          <Icon name="Calendar" size={20} color={colors.text} />
        </Pressable>
      </View>
      {error && (
        <ThemedText className="text-red-500 text-xs mt-1">{error}</ThemedText>
      )}
      {renderDatePicker()}
    </View>
  );
};

export default DatePicker;
