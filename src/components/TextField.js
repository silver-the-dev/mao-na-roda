import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, touch, typography } from '../theme';

/**
 * Campo de texto com rótulo, dica e mensagem de erro.
 * Aceita todas as props do TextInput.
 * @param {import('react-native').TextInputProps & {
 *   label: string,
 *   error?: string,
 *   hint?: string,
 *   ref?: React.Ref<TextInput>,
 * }} props
 */
export default function TextField({ label, error, hint, multiline, style, ref, onFocus, onBlur, ...rest }) {
  const [focado, setFocado] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={(e) => {
          setFocado(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          focado && styles.focused,
          error ? styles.inputError : null,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
  },
  input: {
    minHeight: touch.minHeight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 17,
    color: colors.text,
  },
  multiline: {
    minHeight: 110,
    paddingTop: spacing.md,
  },
  focused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  hint: {
    ...typography.small,
  },
});
