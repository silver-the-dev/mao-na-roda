import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

/**
 * Fotos do item, deslizando para os lados, com indicador de posição.
 * @param {{ uris: string[], icone?: string, altura?: number }} props
 */
export default function PhotoCarousel({ uris, icone = 'cube', altura = 280 }) {
  const { width } = useWindowDimensions();
  const [atual, setAtual] = useState(0);

  if (uris.length === 0) {
    return (
      <View style={[styles.vazio, { height: altura }]} accessibilityLabel="Item sem fotos">
        <Ionicons name={/** @type {'cube'} */ (icone)} size={80} color={colors.primary} />
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setAtual(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {uris.map((uri, i) => (
          <Image
            key={`${uri}-${i}`}
            source={{ uri }}
            style={{ width, height: altura, backgroundColor: colors.surfaceMuted }}
            resizeMode="cover"
            accessibilityLabel={`Foto ${i + 1} de ${uris.length}`}
          />
        ))}
      </ScrollView>
      {uris.length > 1 ? (
        <View style={styles.dots}>
          {uris.map((uri, i) => (
            <View key={`${uri}-${i}`} style={[styles.dot, i === atual && styles.dotAtivo]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  vazio: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  dots: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotAtivo: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
});
