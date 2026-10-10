import { diasBloqueados, encontrarConflito, intervalosSobrepoem, listarDias, validarIntervalo } from '../dateRanges';
import { RegraDeNegocioError } from '../errors';

const i = (/** @type {string} */ inicio, /** @type {string} */ fim) => ({ inicio, fim });

describe('intervalosSobrepoem', () => {
  it('detecta sobreposição parcial nos dois sentidos', () => {
    expect(intervalosSobrepoem(i('2026-03-10', '2026-03-15'), i('2026-03-14', '2026-03-20'))).toBe(true);
    expect(intervalosSobrepoem(i('2026-03-14', '2026-03-20'), i('2026-03-10', '2026-03-15'))).toBe(true);
  });

  it('detecta um intervalo contido no outro', () => {
    expect(intervalosSobrepoem(i('2026-03-10', '2026-03-20'), i('2026-03-12', '2026-03-13'))).toBe(true);
    expect(intervalosSobrepoem(i('2026-03-12', '2026-03-13'), i('2026-03-10', '2026-03-20'))).toBe(true);
  });

  it('o dia da devolução continua ocupado', () => {
    expect(intervalosSobrepoem(i('2026-03-10', '2026-03-12'), i('2026-03-12', '2026-03-14'))).toBe(true);
  });

  it('intervalos de um dia só', () => {
    expect(intervalosSobrepoem(i('2026-03-10', '2026-03-10'), i('2026-03-10', '2026-03-10'))).toBe(true);
    expect(intervalosSobrepoem(i('2026-03-10', '2026-03-10'), i('2026-03-11', '2026-03-11'))).toBe(false);
  });

  it('intervalos encostados ou distantes não se sobrepõem', () => {
    expect(intervalosSobrepoem(i('2026-03-10', '2026-03-12'), i('2026-03-13', '2026-03-14'))).toBe(false);
    expect(intervalosSobrepoem(i('2026-03-20', '2026-03-22'), i('2026-03-01', '2026-03-05'))).toBe(false);
  });

  it('compara corretamente entre meses e anos', () => {
    expect(intervalosSobrepoem(i('2026-12-30', '2027-01-02'), i('2027-01-02', '2027-01-05'))).toBe(true);
    expect(intervalosSobrepoem(i('2026-09-28', '2026-09-30'), i('2026-10-01', '2026-10-03'))).toBe(false);
  });
});

describe('encontrarConflito', () => {
  const existentes = [
    { id: 1, inicio: '2026-03-01', fim: '2026-03-03' },
    { id: 2, inicio: '2026-03-10', fim: '2026-03-12' },
  ];

  it('retorna o intervalo que conflita', () => {
    expect(encontrarConflito(i('2026-03-11', '2026-03-15'), existentes)?.id).toBe(2);
  });

  it('retorna null quando cabe entre os existentes', () => {
    expect(encontrarConflito(i('2026-03-04', '2026-03-09'), existentes)).toBeNull();
    expect(encontrarConflito(i('2026-03-04', '2026-03-09'), [])).toBeNull();
  });
});

describe('listarDias e diasBloqueados', () => {
  it('lista os dias de um intervalo, atravessando o mês', () => {
    expect(listarDias('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
  });

  it('une os dias de vários intervalos sem repetir', () => {
    const dias = diasBloqueados([i('2026-03-01', '2026-03-02'), i('2026-03-02', '2026-03-03')]);
    expect([...dias].sort()).toEqual(['2026-03-01', '2026-03-02', '2026-03-03']);
  });
});

describe('validarIntervalo', () => {
  const hoje = '2026-03-10';

  it('aceita intervalo a partir de hoje', () => {
    expect(() => validarIntervalo(i('2026-03-10', '2026-03-10'), hoje)).not.toThrow();
  });

  it('rejeita retirada no passado, ordem invertida e datas vazias', () => {
    expect(() => validarIntervalo(i('2026-03-09', '2026-03-12'), hoje)).toThrow(RegraDeNegocioError);
    expect(() => validarIntervalo(i('2026-03-12', '2026-03-11'), hoje)).toThrow(RegraDeNegocioError);
    expect(() => validarIntervalo(i('', ''), hoje)).toThrow(RegraDeNegocioError);
  });
});
