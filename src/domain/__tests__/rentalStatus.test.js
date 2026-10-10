import { acoesDisponiveis, etapasLinhaDoTempo, motivoBloqueio, prazoCancelamento } from '../rentalStatus';

const DONO = 1;
const LOCATARIO = 2;

/** @param {Partial<import('../rentalStatus').AluguelParaRegras>} extra */
const aluguel = (extra) => ({
  dono_id: DONO,
  locatario_id: LOCATARIO,
  status: /** @type {import('../../types').RentalStatus} */ ('solicitado'),
  data_inicio: '2026-03-10',
  retirada_apos_corte: false,
  ...extra,
});

describe('permissões por papel', () => {
  it('só o dono aprova, recusa e confirma retirada/devolução', () => {
    const agora = new Date(2026, 2, 1);
    expect(acoesDisponiveis(aluguel({}), DONO, agora)).toEqual(['aprovar', 'recusar']);
    expect(acoesDisponiveis(aluguel({}), LOCATARIO, agora)).toEqual(['cancelar']);
    expect(acoesDisponiveis(aluguel({ status: 'aprovado' }), DONO, agora)).toEqual(['confirmarRetirada']);
    expect(acoesDisponiveis(aluguel({ status: 'em_andamento' }), DONO, agora)).toEqual(['confirmarDevolucao']);
    expect(acoesDisponiveis(aluguel({ status: 'devolvido' }), DONO, agora)).toEqual(['finalizar']);
    expect(acoesDisponiveis(aluguel({ status: 'em_andamento' }), LOCATARIO, agora)).toEqual([]);
  });

  it('terceiros não fazem nada', () => {
    expect(acoesDisponiveis(aluguel({}), 99, new Date(2026, 2, 1))).toEqual([]);
  });

  it('status finais não têm ações', () => {
    for (const status of /** @type {const} */ (['concluido', 'recusado', 'cancelado'])) {
      expect(acoesDisponiveis(aluguel({ status }), DONO, new Date(2026, 2, 1))).toEqual([]);
      expect(acoesDisponiveis(aluguel({ status }), LOCATARIO, new Date(2026, 2, 1))).toEqual([]);
    }
  });
});

describe('cancelamento', () => {
  it('pedido pendente pode ser cancelado a qualquer momento', () => {
    expect(motivoBloqueio(aluguel({}), LOCATARIO, 'cancelar', new Date(2026, 2, 10, 12))).toBeNull();
  });

  it('aprovado com retirada antes das 18h: prazo é 0h do dia anterior', () => {
    const a = aluguel({ status: 'aprovado' });
    expect(prazoCancelamento(a)).toEqual(new Date(2026, 2, 9, 0, 0));
    expect(motivoBloqueio(a, LOCATARIO, 'cancelar', new Date(2026, 2, 8, 23, 59))).toBeNull();
    expect(motivoBloqueio(a, LOCATARIO, 'cancelar', new Date(2026, 2, 9, 0, 1))).toMatch(/24 horas/);
  });

  it('aprovado com retirada a partir das 18h: prazo é 18h do dia anterior', () => {
    const a = aluguel({ status: 'aprovado', retirada_apos_corte: true });
    expect(prazoCancelamento(a)).toEqual(new Date(2026, 2, 9, 18, 0));
    expect(motivoBloqueio(a, LOCATARIO, 'cancelar', new Date(2026, 2, 9, 17, 59))).toBeNull();
    expect(motivoBloqueio(a, LOCATARIO, 'cancelar', new Date(2026, 2, 9, 18, 1))).not.toBeNull();
  });

  it('o dono não cancela', () => {
    expect(motivoBloqueio(aluguel({}), DONO, 'cancelar', new Date(2026, 2, 1))).not.toBeNull();
  });
});

describe('etapasLinhaDoTempo', () => {
  const base = {
    criado_em: '2026-03-01T12:00:00.000Z',
    respondido_em: null,
    retirado_em: null,
    devolvido_em: null,
    concluido_em: null,
    cancelado_em: null,
  };

  it('aluguel em andamento mostra etapas feitas e pendentes', () => {
    const etapas = etapasLinhaDoTempo({
      ...base,
      status: 'em_andamento',
      respondido_em: '2026-03-02T12:00:00.000Z',
      retirado_em: '2026-03-03T12:00:00.000Z',
    });
    expect(etapas.map((e) => e.estado)).toEqual(['feito', 'feito', 'feito', 'pendente', 'pendente']);
  });

  it('recusado e cancelado terminam com etapa negativa', () => {
    expect(etapasLinhaDoTempo({ ...base, status: 'recusado', respondido_em: 'x' }).map((e) => e.rotulo)).toEqual([
      'Pedido enviado',
      'Pedido recusado',
    ]);
    const cancelado = etapasLinhaDoTempo({ ...base, status: 'cancelado', respondido_em: 'x', cancelado_em: 'y' });
    expect(cancelado.map((e) => e.estado)).toEqual(['feito', 'feito', 'negativo']);
  });
});
