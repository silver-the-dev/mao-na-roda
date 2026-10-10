import { Controller } from 'react-hook-form';
import TextField from './TextField';

/**
 * Campo de texto ligado ao React Hook Form. O erro de validação (Zod)
 * aparece embaixo do campo.
 * @template {import('react-hook-form').FieldValues} F
 * @param {Omit<import('react-native').TextInputProps, 'value' | 'onChangeText'> & {
 *   control: import('react-hook-form').Control<F>,
 *   name: import('react-hook-form').Path<F>,
 *   label: string,
 *   hint?: string,
 * }} props
 */
export default function FormField({ control, name, ...rest }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => (
        <TextField
          ref={ref}
          value={value == null ? '' : String(value)}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...rest}
        />
      )}
    />
  );
}
