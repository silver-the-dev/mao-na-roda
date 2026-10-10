import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  ItemCard,
  LoadingState,
  Screen,
  StarRating,
  StatusBadge,
  TextField,
} from '../../src/components';
import { CATEGORIAS, RENTAL_STATUS_LABELS } from '../../src/constants';
import { colors, radius, spacing, typography } from '../../src/theme';

// Etapa 1: vitrine provisória dos componentes base e da navegação.
// A tela Início de verdade (busca, categorias, itens) entra na etapa 5.
export default function InicioScreen() {
  const [categoria, setCategoria] = useState('ferramentas');
  const [nota, setNota] = useState(4);
  const [texto, setTexto] = useState('');

  return (
    <Screen scroll>
      <Text style={styles.aviso}>Vitrine provisória da etapa 1. A tela Início real vem na etapa 5.</Text>

      <Section title="Navegação">
        <Button title="Buscar itens" icon="search" onPress={() => router.push('/busca')} />
        <Button title="Detalhe de um item" variant="outline" onPress={() => router.push('/item/1')} />
        <Button title="Detalhe de um aluguel" variant="outline" onPress={() => router.push('/aluguel/1')} />
        <Button title="Perfil público" variant="outline" onPress={() => router.push('/usuario/2')} />
      </Section>

      <Section title="Botões">
        <Button title="Principal" icon="checkmark" />
        <Button title="Secundário" variant="secondary" />
        <Button title="Contorno" variant="outline" />
        <Button title="Perigo" variant="danger" icon="trash-outline" />
        <Button title="Carregando" loading />
        <Button title="Desativado" disabled />
      </Section>

      <Section title="Campo de texto">
        <TextField label="Nome" placeholder="Seu nome completo" value={texto} onChangeText={setTexto} />
        <TextField label="E-mail" value="email-invalido" error="Informe um e-mail válido." onChangeText={() => {}} />
        <TextField label="Descrição" multiline hint="Até 500 caracteres." />
      </Section>

      <Section title="Categorias (chips)">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIAS.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              icon={/** @type {'cube'} */ (c.icon)}
              selected={categoria === c.value}
              onPress={() => setCategoria(c.value)}
            />
          ))}
        </ScrollView>
      </Section>

      <Section title="Cartão de item">
        <ItemCard
          item={{
            id: 1,
            titulo: 'Furadeira de impacto 650W',
            categoria: 'ferramentas',
            valor_diaria: 1500,
            bairro: 'Centro',
            cidade: 'Campinas',
            dono_nota: 4.5,
            dono_avaliacoes: 12,
          }}
          onPress={() => router.push('/item/1')}
        />
        <ItemCard
          showStatus
          item={{
            id: 2,
            titulo: 'Violão acústico',
            categoria: 'instrumentos',
            valor_diaria: 2000,
            bairro: 'Taquaral',
            cidade: 'Campinas',
            status: 'pausado',
          }}
        />
      </Section>

      <Section title="Estrelas">
        <StarRating value={4.5} count={12} showValue />
        <StarRating value={0} count={0} />
        <Text style={typography.small}>Toque para escolher a nota:</Text>
        <StarRating value={nota} onChange={setNota} size={36} />
      </Section>

      <Section title="Etiquetas de status">
        <View style={styles.badges}>
          {Object.keys(RENTAL_STATUS_LABELS).map((s) => (
            <StatusBadge key={s} status={/** @type {'solicitado'} */ (s)} />
          ))}
          <StatusBadge status="disponivel" />
          <StatusBadge status="pausado" />
        </View>
      </Section>

      <Section title="Estados de tela">
        <View style={styles.stateBox}>
          <LoadingState />
        </View>
        <View style={styles.stateBox}>
          <EmptyState title="Nenhum item encontrado" message="Tente outra busca ou mude os filtros." />
        </View>
        <View style={styles.stateBox}>
          <ErrorState onRetry={() => {}} />
        </View>
      </Section>
    </Screen>
  );
}

/** @param {{ title: string, children: React.ReactNode }} props */
function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={typography.subtitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    ...typography.small,
    backgroundColor: colors.warningSoft,
    color: colors.warning,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  section: {
    gap: spacing.md,
  },
  chips: {
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stateBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});
