import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, touch } from '../theme';

/**
 * Campo de busca com ícone de lupa e botão de limpar.
 * @param {{
 *   value: string,
 *   onChangeText: (t: string) => void,
 *   onSubmit: () => void,
 *   placeholder?: string,
 *   autoFocus?: boolean,
 * }} props
 */
export default function SearchBar({ value, onChangeText, onSubmit, placeholder = 'O que você precisa?', autoFocus }) {
  return (
    <View style={styles.box}>
      <Ionicons name="search" size={22} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        returnKeyType="search"
        autoFocus={autoFocus}
        accessibilityLabel="Buscar itens"
        style={styles.input}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Limpar busca">
          <Ionicons name="close-circle" size={22} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.minHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
});
