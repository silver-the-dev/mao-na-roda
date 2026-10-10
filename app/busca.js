import { useCallback, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  ItemCard,
  LoadingState,
  SearchBar,
  TextField,
} from '../src/components';
import { CATEGORIAS } from '../src/constants';
import { useFocusQuery } from '../src/hooks/useFocusQuery';
import { buscarItens, listarLocalidades } from '../src/repositories/items';
import { useUsuarioId } from '../src/store/session';
import { colors, radius, spacing, typography } from '../src/theme';
import { formatBRL, parseBRL } from '../src/utils/format';

/**
 * @typedef {Object} Filtros
 * @property {string} texto
 * @property {import('../src/types').Categoria | ''} categoria
 * @property {string} precoMin  texto digitado
 * @property {string} precoMax  texto digitado
 * @property {string} cidade
 * @property {string} bairro
 */

/** @param {string | string[] | undefined} v */
const param = (v) => (Array.isArray(v) ? v[0] : v) ?? '';

export default function BuscaScreen() {
  const userId = useUsuarioId();
  const params = useLocalSearchParams();

  /** @type {Filtros} */
  const inicial = {
    texto: param(params.texto),
    categoria: /** @type {Filtros['categoria']} */ (param(params.categoria)),
    precoMin: '',
    precoMax: '',
    cidade: '',
    bairro: '',
  };
  // `filtros` é o que está sendo editado; `aplicados` é o que foi buscado.
  const [filtros, setFiltros] = useState(inicial);
  const [aplicados, setAplicados] = useState(inicial);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const { dados, carregando, erro, recarregar } = useFocusQuery(
    useCallback(async () => {
      const [itens, localidades] = await Promise.all([
        buscarItens({
          texto: aplicados.texto,
          categoria: aplicados.categoria || undefined,
          precoMin: parseBRL(aplicados.precoMin) ?? undefined,
          precoMax: parseBRL(aplicados.precoMax) ?? undefined,
          cidade: aplicados.cidade || undefined,
          bairro: aplicados.bairro || undefined,
          excluirDonoId: userId,
        }),
        listarLocalidades(),
      ]);
      return { itens, localidades };
    }, [aplicados, userId]),
  );

  /** @param {Partial<Filtros>} mudanca */
  function aplicar(mudanca) {
    const novos = { ...filtros, ...mudanca };
    setFiltros(novos);
    setAplicados(novos);
  }

  function limpar() {
    const vazios = { ...filtros, precoMin: '', precoMax: '', cidade: '', bairro: '' };
    setFiltros(vazios);
    setAplicados(vazios);
  }

  const cidades = [...new Set((dados?.localidades ?? []).map((l) => l.cidade))];
  const bairros = (dados?.localidades ?? []).filter((l) => l.cidade === filtros.cidade).map((l) => l.bairro);
  const qtdFiltros = [aplicados.precoMin, aplicados.precoMax, aplicados.cidade, aplicados.bairro].filter(Boolean).length;
  const faixaInvalida =
    parseBRL(filtros.precoMin) !== null &&
    parseBRL(filtros.precoMax) !== null &&
    /** @type {number} */ (parseBRL(filtros.precoMin)) > /** @type {number} */ (parseBRL(filtros.precoMax));

  const cabecalho = (
    <View style={styles.header}>
      <SearchBar
        value={filtros.texto}
        onChangeText={(texto) => setFiltros({ ...filtros, texto })}
        onSubmit={() => aplicar({})}
        autoFocus={!inicial.texto && !inicial.categoria}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Todas" selected={!filtros.categoria} onPress={() => aplicar({ categoria: '' })} />
        {CATEGORIAS.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            icon={/** @type {'cube'} */ (c.icon)}
            selected={filtros.categoria === c.value}
            onPress={() => aplicar({ categoria: c.value })}
          />
        ))}
      </ScrollView>

      <Button
        compact
        variant={qtdFiltros > 0 ? 'secondary' : 'outline'}
        icon={mostrarFiltros ? 'chevron-up' : 'options-outline'}
        title={qtdFiltros > 0 ? `Filtros (${qtdFiltros})` : 'Filtros: preço e local'}
        onPress={() => setMostrarFiltros(!mostrarFiltros)}
      />

      {mostrarFiltros ? (
        <View style={styles.painel}>
          <Text style={typography.label}>Valor da diária (R$)</Text>
          <View style={styles.linha}>
            <View style={styles.metade}>
              <TextField
                label="Mínimo"
                value={filtros.precoMin}
                onChangeText={(precoMin) => setFiltros({ ...filtros, precoMin })}
                keyboardType="decimal-pad"
                placeholder="0,00"
              />
            </View>
            <View style={styles.metade}>
              <TextField
                label="Máximo"
                value={filtros.precoMax}
                onChangeText={(precoMax) => setFiltros({ ...filtros, precoMax })}
                keyboardType="decimal-pad"
                placeholder="100,00"
                error={faixaInvalida ? 'Maior que o mínimo.' : undefined}
              />
            </View>
          </View>

          <Text style={typography.label}>Cidade</Text>
          <View style={styles.wrap}>
            <Chip label="Todas" selected={!filtros.cidade} onPress={() => setFiltros({ ...filtros, cidade: '', bairro: '' })} />
            {cidades.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={filtros.cidade === c}
                onPress={() => setFiltros({ ...filtros, cidade: c, bairro: '' })}
              />
            ))}
          </View>

          {filtros.cidade ? (
            <>
              <Text style={typography.label}>Bairro</Text>
              <View style={styles.wrap}>
                <Chip label="Todos" selected={!filtros.bairro} onPress={() => setFiltros({ ...filtros, bairro: '' })} />
                {bairros.map((b) => (
                  <Chip key={b} label={b} selected={filtros.bairro === b} onPress={() => setFiltros({ ...filtros, bairro: b })} />
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.linha}>
            <Button title="Limpar" variant="ghost" style={styles.metade} onPress={limpar} />
            <Button
              title="Aplicar"
              icon="checkmark"
              style={styles.metade}
              disabled={faixaInvalida}
              onPress={() => {
                aplicar({});
                setMostrarFiltros(false);
              }}
            />
          </View>
        </View>
      ) : null}

      {dados ? (
        <Text style={styles.contagem}>
          {dados.itens.length === 1 ? '1 item encontrado' : `${dados.itens.length} itens encontrados`}
          {aplicados.precoMax && parseBRL(aplicados.precoMax) !== null
            ? ` · até ${formatBRL(/** @type {number} */ (parseBRL(aplicados.precoMax)))}/dia`
            : ''}
        </Text>
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={dados?.itens ?? []}
      keyExtractor={(i) => String(i.id)}
      contentContainerStyle={styles.lista}
      keyboardShouldPersistTaps="handled"
      style={styles.fundo}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={
        carregando ? (
          <LoadingState message="Buscando..." />
        ) : erro ? (
          <ErrorState message={erro} onRetry={recarregar} />
        ) : (
          <EmptyState
            icon="search-outline"
            title="Nenhum item encontrado"
            message="Tente outras palavras, outra categoria ou remova filtros."
            actionLabel={qtdFiltros > 0 || aplicados.categoria ? 'Limpar filtros' : undefined}
            onAction={() => {
              const vazios = { ...inicial, texto: filtros.texto, categoria: /** @type {''} */ ('') };
              setFiltros(vazios);
              setAplicados(vazios);
            }}
          />
        )
      }
      renderItem={({ item }) => <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />}
    />
  );
}

const styles = StyleSheet.create({
  fundo: {
    backgroundColor: colors.background,
  },
  lista: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.md,
  },
  chips: {
    gap: spacing.sm,
  },
  painel: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  linha: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metade: {
    flex: 1,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  contagem: {
    ...typography.small,
    fontWeight: '600',
  },
});
