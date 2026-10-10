// Testes de integração: repositórios + SQL real (SQLite em memória).

import { criarBancoMemoria, prepararBancoDemo } from './helpers/bancoTeste';
import { MIGRACOES, VERSAO_ATUAL, migrar } from '../../db/migrations';
import { RegraDeNegocioError } from '../../domain/errors';
import { hojeISO, toISODate } from '../../utils/format';
import * as users from '../users';
import * as items from '../items';
import * as rentals from '../rentals';
import * as reviews from '../reviews';
import * as messages from '../messages';

jest.mock('../../utils/hash', () => ({
  hashSenha: async (/** @type {string} */ s) => require('node:crypto').createHash('sha256').update(s).digest('hex'),
}));
jest.mock('../../utils/photos', () => ({
  apagarFoto: jest.fn(),
  salvarFoto: jest.fn(),
  apagarTodasFotos: jest.fn(),
}));

const ANA = 1;
const BRUNO = 2;
const CARLA = 3;
const DIEGO = 4;

/** @param {number} n dias a partir de hoje */
function dia(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** @param {Promise<unknown>} promessa @param {RegExp} mensagem */
async function esperaRegra(promessa, mensagem) {
  await expect(promessa).rejects.toThrow(RegraDeNegocioError);
  await expect(promessa).rejects.toThrow(mensagem);
}

/** @type {import('../../db/client').Banco} */
let db;

beforeEach(async () => {
  db = await prepararBancoDemo();
});

describe('migrações', () => {
  it('registra a versão do esquema e não reaplica migrações', async () => {
    const v = /** @type {{ user_version: number }} */ (await db.getFirstAsync('PRAGMA user_version', []));
    expect(v.user_version).toBe(VERSAO_ATUAL);
    expect(VERSAO_ATUAL).toBe(MIGRACOES.length);
    await expect(migrar(db)).resolves.toBeUndefined();
  });

  it('chaves estrangeiras estão ativas', async () => {
    await expect(
      db.runAsync(
        `INSERT INTO items (dono_id, titulo, descricao, categoria, valor_diaria, conservacao, bairro, cidade, criado_em)
         VALUES (999, 'x', 'y', 'outros', 100, 'bom', 'b', 'c', 'agora')`,
        [],
      ),
    ).rejects.toThrow(/FOREIGN KEY/);
  });

  it('banco novo começa na versão 0 e chega à atual', async () => {
    const novo = criarBancoMemoria();
    await migrar(novo);
    const v = /** @type {{ user_version: number }} */ (await novo.getFirstAsync('PRAGMA user_version', []));
    expect(v.user_version).toBe(VERSAO_ATUAL);
  });
});

describe('dados de demonstração', () => {
  it('cria 4 usuários, 15 itens e aluguéis com avaliações', async () => {
    const contar = async (/** @type {string} */ t) =>
      /** @type {{ n: number }} */ (await db.getFirstAsync(`SELECT COUNT(*) AS n FROM ${t}`, [])).n;
    expect(await contar('users')).toBe(4);
    expect(await contar('items')).toBe(15);
    expect(await contar('item_photos')).toBe(15);
    expect(await contar('rentals')).toBe(14);
    expect(await contar('reviews')).toBeGreaterThanOrEqual(10);
  });

  it('nenhum item tem reservas sobrepostas', async () => {
    const r = await db.getFirstAsync(
      `SELECT COUNT(*) AS n FROM rentals a JOIN rentals b
         ON a.item_id = b.item_id AND a.id < b.id
        WHERE a.status IN ('aprovado','em_andamento') AND b.status IN ('aprovado','em_andamento')
          AND a.data_inicio <= b.data_fim AND b.data_inicio <= a.data_fim`,
      [],
    );
    expect(r).toEqual({ n: 0 });
  });
});

describe('usuários', () => {
  it('autentica com a senha de demonstração e rejeita senha errada', async () => {
    const ana = await users.autenticar('  ANA@maonaroda.com ', '123456');
    expect(ana.nome).toBe('Ana Souza');
    expect(ana).not.toHaveProperty('senha_hash');
    await esperaRegra(users.autenticar('ana@maonaroda.com', 'errada'), /E-mail ou senha incorretos/);
    await esperaRegra(users.autenticar('ninguem@x.com', '123456'), /E-mail ou senha incorretos/);
  });

  it('cadastra conta nova e impede e-mail repetido', async () => {
    const u = await users.cadastrarUsuario({
      nome: 'Eva',
      email: 'Eva@Email.com',
      senha: 'segredo1',
      bairro: 'Centro',
      cidade: 'Osasco',
    });
    expect(u.email).toBe('eva@email.com');
    await expect(users.autenticar('eva@email.com', 'segredo1')).resolves.toMatchObject({ id: u.id });
    await esperaRegra(
      users.cadastrarUsuario({ nome: 'Outra', email: 'EVA@email.com', senha: 'x12345', bairro: 'b', cidade: 'c' }),
      /já está cadastrado/,
    );
  });

  it('perfil público calcula nota média e aluguéis concluídos', async () => {
    const ana = await users.buscarPerfilPublico(ANA);
    // Ana recebeu 5, 4, 5 e 5.
    expect(ana?.nota_media).toBeCloseTo(4.75);
    expect(ana?.total_avaliacoes).toBe(4);
    expect(ana?.alugueis_concluidos).toBe(4);
  });
});

describe('itens', () => {
  it('busca por texto ignora acentos e maiúsculas', async () => {
    const r = await items.buscarItens({ texto: 'CAMERA' });
    expect(r.map((i) => i.titulo)).toEqual(['Câmera fotográfica DSLR com lente 18-55']);
    expect(r[0].foto_uri).toBe('file:///docs/fotos/camera.jpg');
    expect((await items.buscarItens({ texto: 'violao capa' })).length).toBe(1);
  });

  it('filtra por categoria, preço, cidade e bairro', async () => {
    const ferramentas = await items.buscarItens({ categoria: 'ferramentas' });
    // O kit de pintura está pausado e não aparece.
    expect(ferramentas.map((i) => i.titulo).sort()).toEqual([
      'Caixa de ferramentas completa',
      'Furadeira de impacto 650W',
      'Lavadora de alta pressão',
    ]);
    const baratos = await items.buscarItens({ precoMax: 1000 });
    expect(baratos.every((i) => i.valor_diaria <= 1000)).toBe(true);
    const faixa = await items.buscarItens({ precoMin: 3000, precoMax: 3500 });
    expect(faixa.map((i) => i.valor_diaria).sort()).toEqual([3000, 3000, 3500]);
    const guarulhos = await items.buscarItens({ cidade: 'guarulhos' });
    expect(guarulhos.map((i) => i.dono_id)).toEqual([DIEGO, DIEGO]);
    const grajau = await items.buscarItens({ bairro: 'Grajaú', excluirDonoId: CARLA });
    expect(grajau).toEqual([]);
  });

  it('cria item com fotos e rejeita mais de 5 fotos sem gravar nada', async () => {
    const dados = {
      titulo: 'Escada de alumínio',
      descricao: 'Escada com 7 degraus, leve e firme.',
      categoria: /** @type {const} */ ('ferramentas'),
      valor_diaria: 900,
      caucao: null,
      conservacao: /** @type {const} */ ('bom'),
      bairro: 'Itaquera',
      cidade: 'São Paulo',
    };
    const id = await items.criarItem(ANA, dados, ['file:///a.jpg', 'file:///b.jpg']);
    const item = await items.buscarItem(id);
    expect(item?.fotos.map((f) => f.uri)).toEqual(['file:///a.jpg', 'file:///b.jpg']);
    expect(item?.dono.nome).toBe('Ana Souza');

    const antes = (await items.listarMeusItens(ANA)).length;
    await esperaRegra(items.criarItem(ANA, dados, ['1', '2', '3', '4', '5', '6']), /no máximo 5 fotos/);
    expect((await items.listarMeusItens(ANA)).length).toBe(antes);
  });

  it('só o dono edita e pausa; item pausado sai da busca', async () => {
    await esperaRegra(items.alterarStatusItem(1, BRUNO, 'pausado'), /Só o dono/);
    await items.alterarStatusItem(1, ANA, 'pausado');
    expect((await items.buscarItens({ texto: 'furadeira' })).length).toBe(0);
    expect((await items.listarMeusItens(ANA)).find((i) => i.id === 1)?.status).toBe('pausado');
  });

  it('não exclui item com aluguel em andamento', async () => {
    // Item 6 (teclado do Bruno) está com a Ana.
    await esperaRegra(items.excluirItem(6, BRUNO), /aprovado ou em andamento/);
  });

  it('exclusão lógica recusa pedidos pendentes e mantém o histórico', async () => {
    // Item 15 (bicicleta do Diego) tem um pedido pendente da Ana (aluguel 11).
    await items.excluirItem(15, DIEGO);
    expect((await items.listarMeusItens(DIEGO)).some((i) => i.id === 15)).toBe(false);
    expect((await rentals.buscarAluguel(11, ANA))?.status).toBe('recusado');
    expect((await items.buscarItem(15))?.status).toBe('excluido');
  });
});

describe('aluguéis', () => {
  it('ninguém aluga o próprio item', async () => {
    await esperaRegra(
      rentals.solicitarAluguel({ itemId: 1, locatarioId: ANA, dataInicio: dia(20), dataFim: dia(21), retiradaAposCorte: false }),
      /seu próprio item/,
    );
  });

  it('calcula o valor total com a regra das 18h', async () => {
    const id = await rentals.solicitarAluguel({
      itemId: 1, locatarioId: CARLA, dataInicio: dia(20), dataFim: dia(22), retiradaAposCorte: true,
    });
    const a = await rentals.buscarAluguel(id, CARLA);
    expect(a?.valor_total).toBe(2 * 1500);
    expect(a?.retirada_apos_corte).toBe(true);
    expect(a?.status).toBe('solicitado');
  });

  it('rejeita datas no passado e datas já reservadas', async () => {
    await esperaRegra(
      rentals.solicitarAluguel({ itemId: 1, locatarioId: CARLA, dataInicio: dia(-1), dataFim: dia(1), retiradaAposCorte: false }),
      /passado/,
    );
    // Furadeira está aprovada para o Diego de +5 a +7.
    await esperaRegra(
      rentals.solicitarAluguel({ itemId: 1, locatarioId: CARLA, dataInicio: dia(7), dataFim: dia(9), retiradaAposCorte: false }),
      /já estão reservadas/,
    );
    expect(await rentals.listarDatasOcupadas(1)).toEqual([{ id: 13, inicio: dia(5), fim: dia(7) }]);
  });

  it('item pausado não aceita pedidos', async () => {
    await esperaRegra(
      rentals.solicitarAluguel({ itemId: 14, locatarioId: ANA, dataInicio: dia(3), dataFim: dia(4), retiradaAposCorte: false }),
      /pausado/,
    );
  });

  it('aprovar recusa automaticamente pedidos sobrepostos', async () => {
    // Câmera (item 9): Bruno pediu +3..+4 (aluguel 12). Diego pede +4..+6.
    const outro = await rentals.solicitarAluguel({
      itemId: 9, locatarioId: DIEGO, dataInicio: dia(4), dataFim: dia(6), retiradaAposCorte: false,
    });
    await esperaRegra(rentals.aprovarAluguel(12, BRUNO), /Só o dono/);
    const r = await rentals.aprovarAluguel(12, CARLA);
    expect(r.recusadosAutomaticamente).toBe(1);
    expect((await rentals.buscarAluguel(outro, DIEGO))?.status).toBe('recusado');
    expect((await rentals.buscarAluguel(12, BRUNO))?.respondido_em).not.toBeNull();
  });

  it('percorre o fluxo completo até concluído', async () => {
    const id = await rentals.solicitarAluguel({
      itemId: 3, locatarioId: DIEGO, dataInicio: hojeISO(), dataFim: dia(1), retiradaAposCorte: false,
    });
    await esperaRegra(rentals.confirmarRetirada(id, ANA), /status atual/);
    await rentals.aprovarAluguel(id, ANA);
    await esperaRegra(rentals.confirmarRetirada(id, DIEGO), /Só o dono/);
    await rentals.confirmarRetirada(id, ANA);
    await rentals.confirmarDevolucao(id, ANA);
    await rentals.finalizarAluguel(id, ANA);
    const a = await rentals.buscarAluguel(id, DIEGO);
    expect(a?.status).toBe('concluido');
    expect([a?.respondido_em, a?.retirado_em, a?.devolvido_em, a?.concluido_em].every(Boolean)).toBe(true);
  });

  it('cancelamento: pendente sim; aprovado só até 24h antes; dono não cancela', async () => {
    await esperaRegra(rentals.cancelarAluguel(12, CARLA), /Só quem pediu/);
    await rentals.cancelarAluguel(12, BRUNO);
    expect((await rentals.buscarAluguel(12, BRUNO))?.status).toBe('cancelado');

    // Aprovado com retirada amanhã: o prazo já passou.
    const amanha = await rentals.solicitarAluguel({
      itemId: 2, locatarioId: BRUNO, dataInicio: dia(1), dataFim: dia(1), retiradaAposCorte: false,
    });
    await rentals.aprovarAluguel(amanha, ANA);
    await esperaRegra(rentals.cancelarAluguel(amanha, BRUNO), /24 horas/);

    // Aprovado com retirada em 5 dias: ainda pode cancelar.
    await rentals.cancelarAluguel(13, DIEGO);
    expect((await rentals.buscarAluguel(13, DIEGO))?.cancelado_em).not.toBeNull();
  });

  it('só os participantes veem o aluguel; listas separam aluguei e emprestei', async () => {
    expect(await rentals.buscarAluguel(10, CARLA)).toBeNull();
    const aluguei = await rentals.listarAlugueis(ANA, 'locatario');
    expect(aluguei.every((a) => a.locatario_id === ANA)).toBe(true);
    expect(aluguei[0].status).toBe('em_andamento');
    expect(aluguei[0].outra_parte_nome).toBe('Bruno Lima');
    const emprestei = await rentals.listarAlugueis(ANA, 'dono', ['concluido']);
    expect(emprestei.map((a) => a.id).sort()).toEqual([1, 2]);
  });
});

describe('avaliações', () => {
  it('só em aluguel concluído, uma por pessoa, por participantes', async () => {
    await esperaRegra(reviews.avaliar({ aluguelId: 10, autorId: ANA, nota: 5 }), /concluído/);
    await esperaRegra(reviews.avaliar({ aluguelId: 7, autorId: ANA, nota: 5 }), /participou/);
    await esperaRegra(reviews.avaliar({ aluguelId: 7, autorId: DIEGO, nota: 6 }), /1 a 5/);

    await reviews.avaliar({ aluguelId: 7, autorId: DIEGO, nota: 3, comentario: '  Bateria fraca.  ' });
    await esperaRegra(reviews.avaliar({ aluguelId: 7, autorId: DIEGO, nota: 5 }), /já avaliou/);

    const doAluguel = await reviews.listarAvaliacoesDoAluguel(7);
    expect(doAluguel).toHaveLength(1);
    expect(doAluguel[0]).toMatchObject({ avaliado_id: CARLA, comentario: 'Bateria fraca.', papel_avaliado: 'dono' });
  });

  it('a nota média é recalculada a partir das avaliações', async () => {
    const antes = await reviews.resumoAvaliacoes(CARLA);
    await reviews.avaliar({ aluguelId: 7, autorId: DIEGO, nota: 1 });
    const depois = await reviews.resumoAvaliacoes(CARLA);
    expect(depois.total).toBe(antes.total + 1);
    expect(depois.media).toBeCloseTo((antes.media * antes.total + 1) / depois.total);
  });
});

describe('mensagens', () => {
  it('participantes trocam mensagens; terceiros não', async () => {
    const antes = await messages.listarMensagens(10, ANA);
    expect(antes).toHaveLength(3);
    await messages.enviarMensagem(10, BRUNO, 'Pode devolver até as 18h.');
    const depois = await messages.listarMensagens(10, ANA);
    expect(depois.at(-1)).toMatchObject({ autor_nome: 'Bruno Lima', texto: 'Pode devolver até as 18h.' });
    await esperaRegra(messages.enviarMensagem(10, CARLA, 'Oi'), /participantes/);
    await esperaRegra(messages.enviarMensagem(10, ANA, '   '), /Escreva/);
  });
});
