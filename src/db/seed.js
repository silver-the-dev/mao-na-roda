// Dados de demonstração. As datas são relativas ao dia em que o banco é
// populado, para que sempre existam aluguéis passados, atuais e futuros.
//
// Contas (todas com a senha 123456):
//   ana@maonaroda.com · bruno@maonaroda.com · carla@maonaroda.com · diego@maonaroda.com

import { calcularValorTotal } from '../domain/pricing';
import { normalizarTexto, toISODate } from '../utils/format';
import { hashSenha } from '../utils/hash';
import { transacaoSemFila } from './client';

export const SENHA_DEMO = '123456';

export const USUARIOS_DEMO = [
  { nome: 'Ana Souza', email: 'ana@maonaroda.com', telefone: '(11) 98765-4321', bairro: 'Itaquera', cidade: 'São Paulo' },
  { nome: 'Bruno Lima', email: 'bruno@maonaroda.com', telefone: '(11) 97654-3210', bairro: 'Capão Redondo', cidade: 'São Paulo' },
  { nome: 'Carla Mendes', email: 'carla@maonaroda.com', telefone: '(11) 96543-2109', bairro: 'Grajaú', cidade: 'São Paulo' },
  { nome: 'Diego Santos', email: 'diego@maonaroda.com', telefone: '(11) 95432-1098', bairro: 'Pimentas', cidade: 'Guarulhos' },
];

/**
 * `dono` é o índice em USUARIOS_DEMO (0 = Ana). `foto` é o nome da imagem em assets/seed.
 * @type {{ dono: number, foto: string, titulo: string, descricao: string, categoria: import('../types').Categoria,
 *          valor_diaria: number, caucao: number | null, conservacao: import('../types').Conservacao,
 *          status?: 'pausado' }[]}
 */
export const ITENS_DEMO = [
  { dono: 0, foto: 'furadeira', titulo: 'Furadeira de impacto 650W', categoria: 'ferramentas', valor_diaria: 1500, caucao: 5000, conservacao: 'bom',
    descricao: 'Furadeira com função impacto, fura parede, madeira e metal. Acompanha jogo com 10 brocas e maleta.' },
  { dono: 0, foto: 'caixa-ferramentas', titulo: 'Caixa de ferramentas completa', categoria: 'ferramentas', valor_diaria: 1000, caucao: null, conservacao: 'otimo',
    descricao: 'Martelo, alicates, chaves de fenda e Phillips, trena de 5 m, nível e jogo de chaves de boca.' },
  { dono: 0, foto: 'projetor', titulo: 'Projetor multimídia 3200 lúmens', categoria: 'eletronicos', valor_diaria: 3000, caucao: 20000, conservacao: 'otimo',
    descricao: 'Ótimo para festas, aulas e cinema em casa. Entrada HDMI e USB. Acompanha cabo HDMI de 3 metros.' },
  { dono: 0, foto: 'panela', titulo: 'Panelão de alumínio 20 litros', categoria: 'utensilios', valor_diaria: 800, caucao: null, conservacao: 'bom',
    descricao: 'Panela grande com tampa, ideal para feijoada, festas e eventos da igreja ou da escola.' },
  { dono: 1, foto: 'violao', titulo: 'Violão acústico com capa', categoria: 'instrumentos', valor_diaria: 1200, caucao: 10000, conservacao: 'bom',
    descricao: 'Violão de cordas de aço, bem regulado. Vem com capa acolchoada, palheta e afinador de clipe.' },
  { dono: 1, foto: 'teclado', titulo: 'Teclado musical 61 teclas', categoria: 'instrumentos', valor_diaria: 2000, caucao: 15000, conservacao: 'otimo',
    descricao: 'Teclado com sensibilidade ao toque, 400 timbres e suporte em X. Fonte inclusa.' },
  { dono: 1, foto: 'microfone', titulo: 'Kit microfone sem fio + caixa', categoria: 'instrumentos', valor_diaria: 1500, caucao: 8000, conservacao: 'bom',
    descricao: 'Dois microfones sem fio com receptor. Perfeito para karaokê, culto e apresentações.' },
  { dono: 1, foto: 'lavadora', titulo: 'Lavadora de alta pressão', categoria: 'ferramentas', valor_diaria: 2500, caucao: 10000, conservacao: 'otimo',
    descricao: 'Lava calçada, carro e quintal com pouca água. Mangueira de 5 m e bico regulável.' },
  { dono: 2, foto: 'camera', titulo: 'Câmera fotográfica DSLR com lente 18-55', categoria: 'cameras', valor_diaria: 4000, caucao: 50000, conservacao: 'otimo',
    descricao: 'Câmera semiprofissional, ideal para ensaios e eventos. Bateria extra e cartão de 64 GB.' },
  { dono: 2, foto: 'filmadora', titulo: 'Filmadora Full HD', categoria: 'cameras', valor_diaria: 3000, caucao: 30000, conservacao: 'bom',
    descricao: 'Filmadora com zoom óptico de 30x e estabilizador. Acompanha tripé leve.' },
  { dono: 2, foto: 'notebook', titulo: 'Notebook 15" para estudos', categoria: 'eletronicos', valor_diaria: 3500, caucao: 60000, conservacao: 'bom',
    descricao: 'Notebook com 8 GB de memória, ótimo para trabalhos, provas on-line e entrevistas.' },
  { dono: 2, foto: 'cafeteira', titulo: 'Cafeteira elétrica para 30 xícaras', categoria: 'utensilios', valor_diaria: 1000, caucao: null, conservacao: 'novo',
    descricao: 'Cafeteira grande para festas, reuniões e eventos. Mantém o café quente por horas.' },
  { dono: 3, foto: 'caixa-som', titulo: 'Caixa de som Bluetooth 100W', categoria: 'eletronicos', valor_diaria: 1500, caucao: 10000, conservacao: 'otimo',
    descricao: 'Som potente com bateria de 8 horas, entrada para microfone e pendrive.' },
  { dono: 3, foto: 'kit-pintura', titulo: 'Kit de pintura com rolos e bandeja', categoria: 'ferramentas', valor_diaria: 900, caucao: null, conservacao: 'regular', status: 'pausado',
    descricao: 'Dois rolos, três pincéis, bandeja, extensor de cabo e lona para proteger o chão.' },
  { dono: 3, foto: 'bicicleta', titulo: 'Bicicleta aro 29 com capacete', categoria: 'outros', valor_diaria: 1200, caucao: 15000, conservacao: 'bom',
    descricao: 'Bicicleta revisada, 21 marchas, com capacete, cadeado e luz traseira.' },
];

/**
 * Aluguéis de demonstração. `item` é o índice em ITENS_DEMO; `locatario`
 * o índice em USUARIOS_DEMO; `inicio`/`fim` são dias a partir de hoje.
 * `avaliacoes`: [nota do locatário para o dono, nota do dono para o locatário].
 * @type {{ item: number, locatario: number, inicio: number, fim: number, aposCorte?: boolean,
 *          status: import('../types').RentalStatus,
 *          avaliacoes?: [({ nota: number, comentario: string | null } | null), ({ nota: number, comentario: string | null } | null)],
 *          mensagens?: [('dono' | 'locatario'), string][] }[]}
 */
export const ALUGUEIS_DEMO = [
  { item: 0, locatario: 1, inicio: -40, fim: -38, status: 'concluido',
    avaliacoes: [{ nota: 5, comentario: 'Furadeira em ótimo estado e a Ana explicou tudo direitinho.' },
                 { nota: 5, comentario: 'Devolveu limpa e no horário combinado.' }] },
  { item: 2, locatario: 2, inicio: -30, fim: -29, aposCorte: true, status: 'concluido',
    avaliacoes: [{ nota: 4, comentario: 'Projetor bom. Só faltou um cabo mais comprido.' },
                 { nota: 5, comentario: null }] },
  { item: 4, locatario: 3, inicio: -25, fim: -21, status: 'concluido',
    avaliacoes: [{ nota: 5, comentario: 'Violão muito bem cuidado. Recomendo o Bruno!' },
                 { nota: 4, comentario: 'Voltou com uma corda desafinada, mas tudo certo.' }] },
  { item: 8, locatario: 0, inicio: -20, fim: -18, status: 'concluido',
    avaliacoes: [{ nota: 5, comentario: 'Fotos do aniversário ficaram lindas. Câmera impecável.' },
                 { nota: 5, comentario: 'Cuidadosa com o equipamento.' }] },
  { item: 7, locatario: 0, inicio: -15, fim: -15, status: 'concluido',
    avaliacoes: [{ nota: 4, comentario: 'Funcionou bem, a mangueira é um pouco curta.' },
                 { nota: 5, comentario: null }] },
  { item: 12, locatario: 2, inicio: -12, fim: -10, status: 'concluido',
    avaliacoes: [{ nota: 5, comentario: 'Som muito alto e bateria durou a festa inteira.' }, null] },
  { item: 10, locatario: 3, inicio: -8, fim: -6, status: 'concluido' },
  { item: 11, locatario: 1, inicio: -5, fim: -4, status: 'recusado' },
  { item: 1, locatario: 2, inicio: -3, fim: -1, status: 'devolvido' },
  { item: 5, locatario: 0, inicio: -2, fim: 2, status: 'em_andamento',
    mensagens: [['locatario', 'Oi Bruno! Posso pegar o teclado de manhã?'],
                ['dono', 'Pode sim, estou em casa a partir das 9h.'],
                ['locatario', 'Combinado, obrigada!']] },
  { item: 14, locatario: 0, inicio: 1, fim: 2, aposCorte: true, status: 'solicitado' },
  { item: 8, locatario: 1, inicio: 3, fim: 4, status: 'solicitado',
    mensagens: [['locatario', 'Oi Carla, é para fotografar o batizado do meu sobrinho.']] },
  { item: 0, locatario: 3, inicio: 5, fim: 7, status: 'aprovado' },
  { item: 6, locatario: 2, inicio: 10, fim: 11, status: 'cancelado' },
];

/**
 * @param {number} dias a partir de hoje
 * @param {number} [hora]
 */
function momento(dias, hora = 10) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, 0, 0, 0);
  return d;
}

/** @param {number} dias */
const data = (dias) => toISODate(momento(dias));
/** @param {number} dias @param {number} [hora] */
const instante = (dias, hora) => momento(dias, hora).toISOString();

/**
 * Datas de cada etapa já alcançada pelo aluguel, coerentes com o status.
 * @param {(typeof ALUGUEIS_DEMO)[number]} a
 */
function linhaDoTempo(a) {
  const ordem = ['solicitado', 'aprovado', 'em_andamento', 'devolvido', 'concluido'];
  const etapa = ordem.indexOf(a.status);
  const criado = Math.min(a.inicio - 3, -1);
  return {
    criado_em: instante(criado, 9),
    respondido_em: etapa >= 1 || a.status === 'recusado' ? instante(criado + 1, 14) : null,
    retirado_em: etapa >= 2 ? instante(a.inicio, a.aposCorte ? 19 : 9) : null,
    devolvido_em: etapa >= 3 ? instante(a.fim, 17) : null,
    concluido_em: etapa >= 4 ? instante(a.fim, 20) : null,
    cancelado_em: a.status === 'cancelado' ? instante(-1, 11) : null,
  };
}

/**
 * Insere todos os dados de demonstração em uma única transação.
 * Deve ser chamada com acesso exclusivo ao banco (dentro da fila).
 * @param {import('./client').Banco} db
 * @param {Record<string, string | null>} fotos nome da imagem -> URI salva no aparelho
 */
export async function popularDemo(db, fotos) {
  const senhaHash = await hashSenha(SENHA_DEMO);

  await transacaoSemFila(db, async (tx) => {
    /** @type {number[]} */
    const usuarios = [];
    for (const u of USUARIOS_DEMO) {
      const r = await tx.runAsync(
        `INSERT INTO users (nome, email, senha_hash, telefone, bairro, cidade, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [u.nome, u.email, senhaHash, u.telefone, u.bairro, u.cidade, instante(-90)],
      );
      usuarios.push(r.lastInsertRowId);
    }

    /** @type {number[]} */
    const itens = [];
    for (const [n, it] of ITENS_DEMO.entries()) {
      const dono = USUARIOS_DEMO[it.dono];
      const r = await tx.runAsync(
        `INSERT INTO items (dono_id, titulo, descricao, categoria, valor_diaria, caucao, conservacao,
                            bairro, cidade, status, texto_busca, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuarios[it.dono],
          it.titulo,
          it.descricao,
          it.categoria,
          it.valor_diaria,
          it.caucao,
          it.conservacao,
          dono.bairro,
          dono.cidade,
          it.status ?? 'disponivel',
          normalizarTexto(`${it.titulo} ${it.descricao}`),
          instante(-80 + n),
        ],
      );
      itens.push(r.lastInsertRowId);
      const foto = fotos[it.foto];
      if (foto) {
        await tx.runAsync('INSERT INTO item_photos (item_id, uri, ordem) VALUES (?, ?, 0)', [r.lastInsertRowId, foto]);
      }
    }

    for (const a of ALUGUEIS_DEMO) {
      const it = ITENS_DEMO[a.item];
      const donoId = usuarios[it.dono];
      const locatarioId = usuarios[a.locatario];
      const inicio = data(a.inicio);
      const fim = data(a.fim);
      const t = linhaDoTempo(a);
      const r = await tx.runAsync(
        `INSERT INTO rentals (item_id, dono_id, locatario_id, data_inicio, data_fim, retirada_apos_corte, valor_total,
                              status, criado_em, respondido_em, retirado_em, devolvido_em, concluido_em, cancelado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itens[a.item],
          donoId,
          locatarioId,
          inicio,
          fim,
          a.aposCorte ? 1 : 0,
          calcularValorTotal(it.valor_diaria, inicio, fim, a.aposCorte ?? false),
          a.status,
          t.criado_em,
          t.respondido_em,
          t.retirado_em,
          t.devolvido_em,
          t.concluido_em,
          t.cancelado_em,
        ],
      );
      const aluguelId = r.lastInsertRowId;

      const [doLocatario, doDono] = a.avaliacoes ?? [null, null];
      if (doLocatario) {
        await tx.runAsync(
          `INSERT INTO reviews (rental_id, autor_id, avaliado_id, nota, comentario, criado_em) VALUES (?, ?, ?, ?, ?, ?)`,
          [aluguelId, locatarioId, donoId, doLocatario.nota, doLocatario.comentario, instante(a.fim + 1, 12)],
        );
      }
      if (doDono) {
        await tx.runAsync(
          `INSERT INTO reviews (rental_id, autor_id, avaliado_id, nota, comentario, criado_em) VALUES (?, ?, ?, ?, ?, ?)`,
          [aluguelId, donoId, locatarioId, doDono.nota, doDono.comentario, instante(a.fim + 1, 15)],
        );
      }

      for (const [i, [quem, texto]] of (a.mensagens ?? []).entries()) {
        const autor = quem === 'dono' ? donoId : locatarioId;
        await tx.runAsync('INSERT INTO messages (rental_id, autor_id, texto, criado_em) VALUES (?, ?, ?, ?)', [
          aluguelId,
          autor,
          texto,
          new Date(momento(Math.min(a.inicio - 1, -1), 18).getTime() + i * 7 * 60000).toISOString(),
        ]);
      }
    }
  });
}

/**
 * Apaga todos os dados (filhos antes dos pais, por causa das chaves estrangeiras).
 * Deve ser chamada com acesso exclusivo ao banco.
 * @param {import('./client').Banco} db
 */
export async function apagarTudo(db) {
  await transacaoSemFila(db, async (tx) => {
    for (const tabela of ['messages', 'reviews', 'rentals', 'item_photos', 'items', 'users']) {
      await tx.execAsync(`DELETE FROM ${tabela}`);
    }
    await tx.execAsync('DELETE FROM sqlite_sequence');
  });
}
