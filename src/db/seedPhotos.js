// Copia as ilustrações de demonstração (assets/seed) para a pasta de fotos
// do app, como se tivessem sido escolhidas na galeria.

import { Asset } from 'expo-asset';
import { salvarFoto } from '../utils/photos';

const IMAGENS = {
  furadeira: require('../../assets/seed/furadeira.jpg'),
  'caixa-ferramentas': require('../../assets/seed/caixa-ferramentas.jpg'),
  lavadora: require('../../assets/seed/lavadora.jpg'),
  'kit-pintura': require('../../assets/seed/kit-pintura.jpg'),
  notebook: require('../../assets/seed/notebook.jpg'),
  projetor: require('../../assets/seed/projetor.jpg'),
  'caixa-som': require('../../assets/seed/caixa-som.jpg'),
  violao: require('../../assets/seed/violao.jpg'),
  teclado: require('../../assets/seed/teclado.jpg'),
  microfone: require('../../assets/seed/microfone.jpg'),
  camera: require('../../assets/seed/camera.jpg'),
  filmadora: require('../../assets/seed/filmadora.jpg'),
  panela: require('../../assets/seed/panela.jpg'),
  cafeteira: require('../../assets/seed/cafeteira.jpg'),
  bicicleta: require('../../assets/seed/bicicleta.jpg'),
};

/**
 * @returns {Promise<Record<string, string | null>>} nome -> URI no aparelho (null se falhar)
 */
export async function copiarFotosDemo() {
  /** @type {Record<string, string | null>} */
  const resultado = {};
  for (const [nome, modulo] of Object.entries(IMAGENS)) {
    try {
      const asset = Asset.fromModule(modulo);
      await asset.downloadAsync();
      resultado[nome] = asset.localUri ? await salvarFoto(asset.localUri) : null;
    } catch (e) {
      // Sem a foto o item continua funcionando: o cartão mostra o ícone da categoria.
      console.warn(`Não foi possível copiar a foto de demonstração "${nome}"`, e);
      resultado[nome] = null;
    }
  }
  return resultado;
}
