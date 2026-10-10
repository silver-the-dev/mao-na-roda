import { formatBRL, parseBRL, centavosParaCampo, formatDate, toISODate } from '../format';

describe('formatBRL', () => {
  it('formata centavos com separadores brasileiros', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(1550)).toBe('R$ 15,50');
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
    expect(formatBRL(100000000)).toBe('R$ 1.000.000,00');
  });
});

describe('parseBRL', () => {
  it('aceita formatos comuns', () => {
    expect(parseBRL('12,50')).toBe(1250);
    expect(parseBRL('R$ 1.200')).toBe(120000);
    expect(parseBRL('8')).toBe(800);
  });

  it('rejeita texto inválido', () => {
    expect(parseBRL('')).toBeNull();
    expect(parseBRL('abc')).toBeNull();
    expect(parseBRL('1,234')).toBeNull();
  });

  it('faz ida e volta com centavosParaCampo', () => {
    expect(parseBRL(centavosParaCampo(4590))).toBe(4590);
  });
});

describe('datas', () => {
  it('formata AAAA-MM-DD como dd/MM/aaaa sem deslocar o dia', () => {
    expect(formatDate('2026-03-01')).toBe('01/03/2026');
  });

  it('gera AAAA-MM-DD a partir de data local', () => {
    expect(toISODate(new Date(2026, 0, 9))).toBe('2026-01-09');
  });
});
