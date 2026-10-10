import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { listarDias } from '../domain/dateRanges';
import { colors, radius, spacing, typography } from '../theme';

LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ],
  monthNamesShort: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

/**
 * @typedef {{ inicio: string | null, fim: string | null }} Selecao
 */

/**
 * Calendário para escolher retirada e devolução. Dias reservados ficam
 * bloqueados. Primeiro toque: retirada; segundo toque: devolução.
 * Tocar duas vezes no mesmo dia escolhe um aluguel de um dia só.
 * @param {{
 *   value: Selecao,
 *   onChange: (s: Selecao) => void,
 *   bloqueados: Set<string>,
 *   minDate: string,
 *   onAviso?: (mensagem: string) => void,
 * }} props
 */
export default function DateRangePicker({ value, onChange, bloqueados, minDate, onAviso }) {
  /** @param {{ dateString: string }} dia */
  function tocar({ dateString: d }) {
    if (bloqueados.has(d)) return;
    const { inicio, fim } = value;
    if (!inicio || fim || d < inicio) {
      onChange({ inicio: d, fim: null });
      return;
    }
    const temReservaNoMeio = listarDias(inicio, d).some((dia) => bloqueados.has(dia));
    if (temReservaNoMeio) {
      onAviso?.('Há dias reservados nesse período. Escolha datas sem reservas no meio.');
      onChange({ inicio: d, fim: null });
      return;
    }
    onChange({ inicio, fim: d });
  }

  const marcados = useMemo(() => {
    /** @type {Record<string, object>} */
    const m = {};
    for (const d of bloqueados) {
      m[d] = {
        disabled: true,
        disableTouchEvent: true,
        customStyles: {
          container: { backgroundColor: colors.dangerSoft, borderRadius: radius.sm },
          text: { color: colors.danger, textDecorationLine: 'line-through' },
        },
      };
    }
    if (value.inicio) {
      const dias = value.fim ? listarDias(value.inicio, value.fim) : [value.inicio];
      for (const d of dias) {
        const ponta = d === value.inicio || d === value.fim;
        m[d] = {
          customStyles: {
            container: { backgroundColor: ponta ? colors.primary : colors.primarySoft, borderRadius: radius.sm },
            text: { color: ponta ? colors.onPrimary : colors.primaryDark, fontWeight: '700' },
          },
        };
      }
    }
    return m;
  }, [bloqueados, value.inicio, value.fim]);

  return (
    <View style={styles.wrapper}>
      <Calendar
        testID="calendario"
        minDate={minDate}
        markingType="custom"
        markedDates={marcados}
        onDayPress={tocar}
        enableSwipeMonths
        firstDay={0}
        style={styles.calendario}
        theme={{
          calendarBackground: colors.surface,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          textMonthFontWeight: '700',
          textMonthFontSize: 19,
          textDayFontSize: 17,
          textDayHeaderFontSize: 14,
          textSectionTitleColor: colors.textMuted,
          dayTextColor: colors.text,
          todayTextColor: colors.primary,
          textDisabledColor: '#A3A9B3',
        }}
      />
      <View style={styles.legenda}>
        <Legenda cor={colors.primary} texto="Selecionado" />
        <Legenda cor={colors.dangerSoft} borda={colors.danger} texto="Reservado" />
      </View>
    </View>
  );
}

/** @param {{ cor: string, borda?: string, texto: string }} props */
function Legenda({ cor, borda, texto }) {
  return (
    <View style={styles.legendaItem}>
      <View style={[styles.quadrado, { backgroundColor: cor, borderColor: borda ?? cor }]} />
      <Text style={typography.small}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  calendario: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  legenda: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quadrado: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
  },
});
