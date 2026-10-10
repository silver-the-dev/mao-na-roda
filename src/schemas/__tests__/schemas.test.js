import { cadastroSchema, loginSchema } from '../auth';
import { itemSchema, paraDadosItem, paraFormularioItem } from '../item';
import { avaliacaoSchema, perfilSchema } from '../perfil';

describe('auth', () => {
  it('login exige e-mail válido e senha', () => {
    expect(loginSchema.safeParse({ email: 'ana@maonaroda.com', senha: '1' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'ana', senha: '1' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'ana@x.com', senha: '' }).success).toBe(false);
  });

  it('cadastro exige senhas iguais e com 6 caracteres', () => {
    const base = { nome: 'Eva', email: 'eva@x.com', senha: '123456', confirmarSenha: '123456', bairro: 'Centro', cidade: 'Osasco' };
    expect(cadastroSchema.safeParse(base).success).toBe(true);
    const diferentes = cadastroSchema.safeParse({ ...base, confirmarSenha: '654321' });
    expect(diferentes.success).toBe(false);
    expect(diferentes.error?.issues[0].path).toEqual(['confirmarSenha']);
    expect(cadastroSchema.safeParse({ ...base, senha: '123', confirmarSenha: '123' }).success).toBe(false);
  });
});

describe('item', () => {
  const form = {
    titulo: 'Furadeira',
    descricao: 'Furadeira de impacto com brocas.',
    categoria: 'ferramentas',
    conservacao: 'bom',
    valorDiaria: '15,50',
    caucao: '',
    bairro: 'Centro',
    cidade: 'Osasco',
  };

  it('valida e converte valores para centavos', () => {
    expect(itemSchema.safeParse(form).success).toBe(true);
    expect(paraDadosItem(form)).toMatchObject({ valor_diaria: 1550, caucao: null });
    expect(paraDadosItem({ ...form, caucao: '100' }).caucao).toBe(10000);
  });

  it('rejeita diária zerada, caução inválida e categoria vazia', () => {
    expect(itemSchema.safeParse({ ...form, valorDiaria: '0' }).success).toBe(false);
    expect(itemSchema.safeParse({ ...form, caucao: 'abc' }).success).toBe(false);
    expect(itemSchema.safeParse({ ...form, categoria: '' }).success).toBe(false);
  });

  it('faz ida e volta entre item e formulário', () => {
    const dados = paraDadosItem(form);
    const item = { ...dados, id: 1, dono_id: 1, status: /** @type {const} */ ('disponivel'), criado_em: '' };
    expect(paraDadosItem(paraFormularioItem(item))).toEqual(dados);
  });
});

describe('perfil e avaliação', () => {
  it('telefone é opcional, mas precisa ter DDD', () => {
    const base = { nome: 'Ana', telefone: '', bairro: 'Itaquera', cidade: 'São Paulo' };
    expect(perfilSchema.safeParse(base).success).toBe(true);
    expect(perfilSchema.safeParse({ ...base, telefone: '(11) 98765-4321' }).success).toBe(true);
    expect(perfilSchema.safeParse({ ...base, telefone: '98765' }).success).toBe(false);
  });

  it('avaliação exige nota de 1 a 5', () => {
    expect(avaliacaoSchema.safeParse({ nota: 0, comentario: '' }).success).toBe(false);
    expect(avaliacaoSchema.safeParse({ nota: 5, comentario: '' }).success).toBe(true);
  });
});
