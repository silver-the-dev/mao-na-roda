import { calcularValorTotal, contarDiarias, diasCorridos } from '../pricing';
import { RegraDeNegocioError } from '../errors';

describe('diasCorridos', () => {
  it('conta os dois dias das pontas', () => {
    expect(diasCorridos('2026-03-10', '2026-03-10')).toBe(1);
    expect(diasCorridos('2026-03-10', '2026-03-12')).toBe(3);
  });

  it('atravessa virada de mês e de ano', () => {
    expect(diasCorridos('2026-01-30', '2026-02-02')).toBe(4);
    expect(diasCorridos('2026-12-31', '2027-01-01')).toBe(2);
  });

  it('considera ano bissexto', () => {
    expect(diasCorridos('2028-02-28', '2028-03-01')).toBe(3);
  });
});

describe('contarDiarias', () => {
  it('retirada antes das 18h cobra o dia da retirada', () => {
    expect(contarDiarias('2026-03-10', '2026-03-12', false)).toBe(3);
  });

  it('retirada a partir das 18h não cobra o dia da retirada', () => {
    expect(contarDiarias('2026-03-10', '2026-03-12', true)).toBe(2);
  });

  it('cobra no mínimo uma diária', () => {
    expect(contarDiarias('2026-03-10', '2026-03-10', false)).toBe(1);
    expect(contarDiarias('2026-03-10', '2026-03-10', true)).toBe(1);
    expect(contarDiarias('2026-03-10', '2026-03-11', true)).toBe(1);
  });

  it('rejeita devolução antes da retirada', () => {
    expect(() => contarDiarias('2026-03-12', '2026-03-10', false)).toThrow(RegraDeNegocioError);
  });
});

describe('calcularValorTotal', () => {
  it('multiplica diárias pelo valor da diária, em centavos', () => {
    expect(calcularValorTotal(1500, '2026-03-10', '2026-03-12', false)).toBe(4500);
    expect(calcularValorTotal(1500, '2026-03-10', '2026-03-12', true)).toBe(3000);
    expect(calcularValorTotal(2990, '2026-03-01', '2026-03-07', false)).toBe(20930);
  });

  it('rejeita valor de diária inválido', () => {
    expect(() => calcularValorTotal(0, '2026-03-10', '2026-03-12', false)).toThrow(RegraDeNegocioError);
    expect(() => calcularValorTotal(10.5, '2026-03-10', '2026-03-12', false)).toThrow(RegraDeNegocioError);
  });
});
