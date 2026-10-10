import { comBanco } from '../db/client';
import { RegraDeNegocioError } from '../domain/errors';
import { nowISO } from '../utils/format';
import { hashSenha } from '../utils/hash';
import { apagarFoto, salvarFoto } from '../utils/photos';

/**
 * Perfil público: dados do usuário mais reputação calculada.
 * @typedef {import('../types').User & {
 *   nota_media: number,
 *   total_avaliacoes: number,
 *   alugueis_concluidos: number,
 *   itens_anunciados: number,
 * }} PerfilPublico
 */

// Nunca devolvemos senha_hash para fora do repositório.
const COLUNAS_PUBLICAS = 'id, nome, email, foto_uri, telefone, bairro, cidade, criado_em';

/** @param {string} email */
function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

/**
 * Cria uma conta. O e-mail é único (sem diferenciar maiúsculas).
 * @param {{ nome: string, email: string, senha: string, bairro: string, cidade: string }} dados
 * @returns {Promise<import('../types').User>}
 */
export async function cadastrarUsuario(dados) {
  const email = normalizarEmail(dados.email);
  const senhaHash = await hashSenha(dados.senha);

  return comBanco(async (db) => {
    const existente = await db.getFirstAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existente) {
      throw new RegraDeNegocioError('Este e-mail já está cadastrado. Entre com sua senha ou use outro e-mail.');
    }
    const r = await db.runAsync(
      `INSERT INTO users (nome, email, senha_hash, bairro, cidade, criado_em) VALUES (?, ?, ?, ?, ?, ?)`,
      [dados.nome.trim(), email, senhaHash, dados.bairro.trim(), dados.cidade.trim(), nowISO()],
    );
    const usuario = await db.getFirstAsync(`SELECT ${COLUNAS_PUBLICAS} FROM users WHERE id = ?`, [r.lastInsertRowId]);
    return /** @type {import('../types').User} */ (usuario);
  });
}

/**
 * Confere e-mail e senha. Lança erro com mensagem genérica se não baterem.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<import('../types').User>}
 */
export async function autenticar(email, senha) {
  const senhaHash = await hashSenha(senha);
  const usuario = await comBanco((db) =>
    db.getFirstAsync(`SELECT ${COLUNAS_PUBLICAS} FROM users WHERE email = ? AND senha_hash = ?`, [
      normalizarEmail(email),
      senhaHash,
    ]),
  );
  if (!usuario) throw new RegraDeNegocioError('E-mail ou senha incorretos.');
  return /** @type {import('../types').User} */ (usuario);
}

/**
 * @param {number} id
 * @returns {Promise<import('../types').User | null>}
 */
export function buscarUsuario(id) {
  return comBanco(async (db) => {
    const u = await db.getFirstAsync(`SELECT ${COLUNAS_PUBLICAS} FROM users WHERE id = ?`, [id]);
    return /** @type {import('../types').User | null} */ (u);
  });
}

/**
 * Lista as contas existentes (usado na tela de diagnóstico e no login de teste).
 * @returns {Promise<import('../types').User[]>}
 */
export function listarUsuarios() {
  return comBanco(async (db) => {
    const linhas = await db.getAllAsync(`SELECT ${COLUNAS_PUBLICAS} FROM users ORDER BY id`, []);
    return /** @type {import('../types').User[]} */ (linhas);
  });
}

/**
 * Perfil com nota média, número de avaliações e de aluguéis concluídos
 * (como dono ou como locatário). A nota é sempre calculada a partir de reviews.
 * @param {number} id
 * @returns {Promise<PerfilPublico | null>}
 */
export function buscarPerfilPublico(id) {
  return comBanco(async (db) => {
    const perfil = await db.getFirstAsync(
      `SELECT ${COLUNAS_PUBLICAS},
              COALESCE((SELECT AVG(nota) FROM reviews WHERE avaliado_id = u.id), 0) AS nota_media,
              (SELECT COUNT(*) FROM reviews WHERE avaliado_id = u.id) AS total_avaliacoes,
              (SELECT COUNT(*) FROM rentals
                WHERE status = 'concluido' AND (dono_id = u.id OR locatario_id = u.id)) AS alugueis_concluidos,
              (SELECT COUNT(*) FROM items WHERE dono_id = u.id AND status = 'disponivel') AS itens_anunciados
         FROM users u WHERE u.id = ?`,
      [id],
    );
    return /** @type {PerfilPublico | null} */ (perfil);
  });
}

/**
 * Atualiza os dados editáveis do perfil.
 * @param {number} id
 * @param {{ nome: string, telefone: string | null, bairro: string, cidade: string, foto_uri: string | null }} dados
 */
export async function atualizarPerfil(id, dados) {
  const nome = dados.nome.trim();
  if (nome.length < 2) throw new RegraDeNegocioError('Informe seu nome.');
  return comBanco(async (db) => {
    await db.runAsync(`UPDATE users SET nome = ?, telefone = ?, bairro = ?, cidade = ?, foto_uri = ? WHERE id = ?`, [
      nome,
      dados.telefone?.trim() || null,
      dados.bairro.trim(),
      dados.cidade.trim(),
      dados.foto_uri,
      id,
    ]);
  });
}

/**
 * Atualiza o perfil e a foto. Uma foto nova é copiada para a pasta do app;
 * a foto anterior é apagada quando deixa de ser usada.
 * @param {number} id
 * @param {{ nome: string, telefone: string | null, bairro: string, cidade: string }} dados
 * @param {string | null} fotoEscolhida URI da galeria, a foto atual ou null para remover
 */
export async function atualizarPerfilComFoto(id, dados, fotoEscolhida) {
  const atual = await buscarUsuario(id);
  if (!atual) throw new RegraDeNegocioError('Usuário não encontrado.');
  const foto = fotoEscolhida ? await salvarFoto(fotoEscolhida) : null;
  try {
    await atualizarPerfil(id, { ...dados, foto_uri: foto });
  } catch (e) {
    if (foto && foto !== atual.foto_uri) apagarFoto(foto);
    throw e;
  }
  if (atual.foto_uri && atual.foto_uri !== foto) apagarFoto(atual.foto_uri);
}
