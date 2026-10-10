import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import Avatar from './Avatar';
import StarRating from './StarRating';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Cabeçalho de perfil: foto, nome, local, nota e números de reputação.
 * @param {{ perfil: import('../repositories/users').PerfilPublico }} props
 */
export default function ProfileHeader({ perfil }) {
  const desde = new Date(perfil.criado_em);
  return (
    <View style={styles.wrapper}>
      <Avatar nome={perfil.nome} uri={perfil.foto_uri} size={96} />
      <Text style={[typography.title, styles.centro]}>{perfil.nome}</Text>
      <Text style={typography.small}>
        {perfil.bairro}, {perfil.cidade} · no app desde {MESES[desde.getMonth()]}/{desde.getFullYear()}
      </Text>
      <StarRating value={perfil.nota_media} count={perfil.total_avaliacoes} showValue size={24} />

      <View style={styles.numeros}>
        <Numero
          valor={perfil.total_avaliacoes ? perfil.nota_media.toFixed(1).replace('.', ',') : '–'}
          rotulo="nota média"
        />
        <Numero valor={String(perfil.total_avaliacoes)} rotulo={perfil.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'} />
        <Numero
          valor={String(perfil.alugueis_concluidos)}
          rotulo={perfil.alugueis_concluidos === 1 ? 'aluguel concluído' : 'aluguéis concluídos'}
        />
      </View>
    </View>
  );
}

/** @param {{ valor: string, rotulo: string }} props */
function Numero({ valor, rotulo }) {
  return (
    <View style={styles.numero} accessible accessibilityLabel={`${valor} ${rotulo}`}>
      <Text style={styles.numeroValor}>{valor}</Text>
      <Text style={styles.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  centro: {
    textAlign: 'center',
  },
  numeros: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  numero: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  numeroValor: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  numeroRotulo: {
    ...typography.small,
    fontSize: 14,
    textAlign: 'center',
  },
});
