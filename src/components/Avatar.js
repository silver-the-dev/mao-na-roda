import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/**
 * Foto de perfil redonda; sem foto, mostra as iniciais do nome.
 * @param {{ nome: string, uri?: string | null, size?: number }} props
 */
export default function Avatar({ nome, uri, size = 48 }) {
  const dims = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.base, dims]} accessibilityLabel={`Foto de ${nome}`} />;
  }

  const iniciais = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={[styles.base, styles.fallback, dims]} accessibilityLabel={`Foto de ${nome}`}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{iniciais || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceMuted,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  initials: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
