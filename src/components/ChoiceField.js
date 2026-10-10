import { StyleSheet, Text, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { colors, spacing, typography } from '../theme';
import Chip from './Chip';

/**
 * Escolha única entre opções (chips), ligada ao React Hook Form.
 * @template {import('react-hook-form').FieldValues} F
 * @param {{
 *   control: import('react-hook-form').Control<F>,
 *   name: import('react-hook-form').Path<F>,
 *   label: string,
 *   options: { value: string, label: string, icon?: string }[],
 * }} props
 */
export default function ChoiceField({ control, name, label, options }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <View style={styles.wrapper} accessibilityRole="radiogroup" accessibilityLabel={label}>
          <Text style={typography.label}>{label}</Text>
          <View style={styles.options}>
            {options.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                icon={/** @type {'cube' | undefined} */ (o.icon)}
                selected={value === o.value}
                onPress={() => onChange(o.value)}
              />
            ))}
          </View>
          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
});
