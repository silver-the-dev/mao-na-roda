// Fotos ficam em <documentos do app>/fotos. O banco guarda só o caminho (URI).

import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const NOME_PASTA = 'fotos';

function pastaFotos() {
  const dir = new Directory(Paths.document, NOME_PASTA);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/**
 * Copia uma imagem (da galeria, câmera ou assets) para a pasta do app.
 * Se a imagem já estiver na pasta do app, devolve a mesma URI.
 * @param {string} uriOrigem
 * @returns {Promise<string>} URI do arquivo copiado
 */
export async function salvarFoto(uriOrigem) {
  const pasta = pastaFotos();
  if (uriOrigem.startsWith(pasta.uri)) return uriOrigem;

  const origem = new File(uriOrigem);
  const extensao = origem.extension || '.jpg';
  const destino = new File(pasta, `${Crypto.randomUUID()}${extensao}`);
  await origem.copy(destino);
  return destino.uri;
}

/**
 * Apaga uma foto da pasta do app. Erros são ignorados (arquivo já removido).
 * @param {string} uri
 */
export function apagarFoto(uri) {
  try {
    const arquivo = new File(uri);
    if (arquivo.exists) arquivo.delete();
  } catch {
    // Arquivo inexistente ou fora da pasta do app: nada a fazer.
  }
}

/** Remove todas as fotos salvas pelo app (usado ao restaurar a demonstração). */
export function apagarTodasFotos() {
  const dir = new Directory(Paths.document, NOME_PASTA);
  if (dir.exists) dir.delete();
}
