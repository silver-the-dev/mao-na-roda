import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Seleção de até `max` fotos da galeria. A primeira foto é a capa.
 * Toque em uma foto para usá-la como capa ou removê-la.
 * @param {{ value: string[], onChange: (uris: string[]) => void, max: number, label?: string }} props
 */
export default function PhotoPicker({ value, onChange, max, label = 'Fotos' }) {
  const restantes = max - value.length;

  async function adicionar() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso às fotos para escolher imagens do item.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: restantes,
      quality: 0.7,
    });
    if (r.canceled) return;
    onChange([...value, ...r.assets.map((a) => a.uri)].slice(0, max));
  }

  /** @param {number} indice */
  function opcoes(indice) {
    /** @type {import('react-native').AlertButton[]} */
    const botoes = [];
    if (indice > 0) {
      botoes.push({
        text: 'Usar como capa',
        onPress: () => onChange([value[indice], ...value.filter((_, i) => i !== indice)]),
      });
    }
    botoes.push({ text: 'Remover foto', style: 'destructive', onPress: () => onChange(value.filter((_, i) => i !== indice)) });
    botoes.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Foto', undefined, botoes);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={typography.label}>
        {label} ({value.length} de {max})
      </Text>
      <Text style={typography.small}>A primeira foto é a capa. Toque em uma foto para mudar a capa ou remover.</Text>
      <View style={styles.grid}>
        {value.map((uri, i) => (
          <Pressable
            key={`${uri}-${i}`}
            onPress={() => opcoes(i)}
            accessibilityRole="button"
            accessibilityLabel={i === 0 ? 'Foto de capa. Toque para opções' : `Foto ${i + 1}. Toque para opções`}
            style={styles.thumbWrap}
          >
            <Image source={{ uri }} style={styles.thumb} />
            {i === 0 ? <Text style={styles.capa}>Capa</Text> : null}
          </Pressable>
        ))}
        {restantes > 0 ? (
          <Pressable
            onPress={adicionar}
            accessibilityRole="button"
            accessibilityLabel="Adicionar fotos da galeria"
            style={({ pressed }) => [styles.thumbWrap, styles.add, pressed && styles.pressed]}
          >
            <Ionicons name="images-outline" size={30} color={colors.primaryDark} />
            <Text style={styles.addText}>Adicionar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const TAM = 100;

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumbWrap: {
    width: TAM,
    height: TAM,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceMuted,
  },
  capa: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 2,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimary,
    backgroundColor: colors.primary,
  },
  add: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  addText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.8,
  },
});
