import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

const COLORS = {
  brand: '#6c3bff',
  secondary: '#f2f2f7',
  onBrand: '#ffffff',
  textBrand: '#6c3bff',
};

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Shared pill button matching the Figma `buttons` component (48px tall, 12 radius).
export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  leftIcon,
  rightIcon,
  disabled,
  style,
}: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {leftIcon}
      <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
        {label}
      </Text>
      {rightIcon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    width: '100%',
  },
  primary: {
    backgroundColor: COLORS.brand,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
  },
  labelPrimary: {
    color: COLORS.onBrand,
  },
  labelSecondary: {
    color: COLORS.textBrand,
  },
});
