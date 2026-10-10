// Teste de fumaça das telas: renderiza as rotas reais do app (Expo Router)
// com os repositórios reais e um SQLite em memória populado com os dados
// de demonstração. Garante que cada tela abre e mostra o conteúdo esperado.

import { Alert } from 'react-native';
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { listarAlugueis } from '../src/repositories/rentals';
import { useSession } from '../src/store/session';
import { hojeISO, toISODate } from '../src/utils/format';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => {
    const { criarBancoMemoria } = require('../src/repositories/__tests__/helpers/bancoTeste');
    return criarBancoMemoria();
  },
}));
jest.mock('../src/db/seedPhotos', () => ({
  copiarFotosDemo: async () => ({}),
}));
jest.mock('../src/utils/hash', () => ({
  hashSenha: async (/** @type {string} */ s) => require('node:crypto').createHash('sha256').update(s).digest('hex'),
}));
jest.mock('../src/utils/photos', () => ({
  apagarFoto: jest.fn(),
  apagarTodasFotos: jest.fn(),
  salvarFoto: jest.fn(async (/** @type {string} */ u) => u),
  salvarFotos: jest.fn(async (/** @type {string[]} */ uris) => ({ uris, novas: [] })),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.setTimeout(30000);

const ANA = 1;
const BRUNO = 2;
const DIEGO = 4;

/** Entra direto como um usuário (o login pela tela é testado à parte). */
async function entrarComo(/** @type {number} */ id) {
  await act(async () => {
    await useSession.getState().signIn(id);
  });
}

/** @param {string} url */
async function abrir(url) {
  renderRouter('./app', { initialUrl: url });
  // Espera o banco abrir (tela "Preparando o app...").
  await screen.findByText(/./, {}, { timeout: 10000 });
}

/** @param {string} url */
async function ir(url) {
  await act(async () => {
    router.push(/** @type {never} */ (url));
  });
}

afterEach(async () => {
  await act(async () => {
    await useSession.getState().signOut();
  });
});

it('login: rejeita senha errada e entra com conta de demonstração', async () => {
  renderRouter('./app', { initialUrl: '/' });
  await screen.findByText('Contas de demonstração', {}, { timeout: 10000 });

  fireEvent.changeText(screen.getByLabelText('E-mail'), 'ana@maonaroda.com');
  fireEvent.changeText(screen.getByLabelText('Senha'), 'errada');
  fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
  await screen.findByText('E-mail ou senha incorretos.');

  fireEvent.press(screen.getByRole('button', { name: 'Bruno' }));
  fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
  await screen.findByText('Olá, Bruno!');
  // Itens dos outros aparecem; os do próprio Bruno não.
  expect(await screen.findByText('Furadeira de impacto 650W')).toBeTruthy();
  expect(screen.queryByText('Violão acústico com capa')).toBeNull();
});

it('cadastro: e-mail repetido mostra erro claro', async () => {
  renderRouter('./app', { initialUrl: '/cadastro' });
  await screen.findByText('Crie sua conta para alugar e anunciar itens.', {}, { timeout: 10000 });
  fireEvent.changeText(screen.getByLabelText('Nome completo'), 'Outra Ana');
  fireEvent.changeText(screen.getByLabelText('E-mail'), 'ANA@maonaroda.com');
  fireEvent.changeText(screen.getByLabelText('Senha'), '123456');
  fireEvent.changeText(screen.getByLabelText('Repita a senha'), '123456');
  fireEvent.changeText(screen.getByLabelText('Bairro'), 'Centro');
  fireEvent.changeText(screen.getByLabelText('Cidade'), 'Osasco');
  fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
  await screen.findByText(/Este e-mail já está cadastrado/);
});

it('busca, detalhe do item e tela de solicitar aluguel', async () => {
  await entrarComo(BRUNO);
  await abrir('/busca?texto=camera');
  await screen.findByText('Câmera fotográfica DSLR com lente 18-55');
  expect(screen.getByText('1 item encontrado')).toBeTruthy();

  await ir('/item/1');
  await screen.findByText('Anunciado por');
  expect(screen.getByText('Ana Souza')).toBeTruthy();
  expect(screen.getByText('Datas já reservadas')).toBeTruthy();

  fireEvent.press(screen.getByRole('button', { name: 'Quero alugar' }));
  await screen.findByText('Toque no dia da retirada.');
  expect(screen.getByText('Horário da retirada')).toBeTruthy();
});

it('aluguéis: abas aluguei/emprestei e detalhe com ações do dono', async () => {
  await entrarComo(ANA);
  await abrir('/alugueis');
  await screen.findByText('Teclado musical 61 teclas');

  fireEvent.press(screen.getByRole('tab', { name: 'Emprestei' }));
  await screen.findByText('Caixa de ferramentas completa');
  expect(screen.getByText('Confira o item e finalize o aluguel')).toBeTruthy();

  // Aluguel 9: caixa de ferramentas devolvida, aguardando a Ana finalizar.
  await ir('/aluguel/9');
  await screen.findByText('Andamento');
  expect(screen.getByRole('button', { name: 'Finalizar aluguel' })).toBeTruthy();
  expect(screen.getByText('Mensagens')).toBeTruthy();
});

it('detalhe do aluguel mostra mensagens e cancelamento para o locatário', async () => {
  await entrarComo(ANA);
  await abrir('/aluguel/10');
  await screen.findByText('Oi Bruno! Posso pegar o teclado de manhã?');

  await ir('/aluguel/11');
  await screen.findByRole('button', { name: 'Cancelar solicitação' });
});

it('avaliar: tela abre para aluguel concluído sem avaliação', async () => {
  await entrarComo(DIEGO);
  await abrir('/aluguel/7/avaliar');
  await screen.findByText('Como foi alugar com Carla?');
  fireEvent.press(screen.getByRole('button', { name: 'Enviar avaliação' }));
  await screen.findByText('Toque nas estrelas para dar uma nota.');
});

it('perfis, meus itens e formulários de item', async () => {
  await entrarComo(ANA);
  await abrir('/perfil');
  await screen.findByText('Configurações');
  expect(screen.getByText('Avaliações recebidas')).toBeTruthy();

  await ir('/usuario/2');
  await screen.findByText('Itens de Bruno');

  await ir('/anunciar');
  await screen.findByRole('button', { name: 'Anunciar novo item' });
  expect(screen.getByText('Projetor multimídia 3200 lúmens')).toBeTruthy();

  await ir('/item/novo');
  await screen.findByRole('button', { name: 'Publicar anúncio' });
  fireEvent.press(screen.getByRole('button', { name: 'Publicar anúncio' }));
  await screen.findByText('Confira os campos destacados acima.');

  await ir('/item/1/editar');
  await screen.findByDisplayValue('Furadeira de impacto 650W');

  await ir('/perfil/editar');
  await screen.findByDisplayValue('(11) 98765-4321');
});

it('fluxo completo pela interface: pedir, aprovar, retirar, devolver, finalizar e avaliar', async () => {
  // Confirma automaticamente os diálogos de confirmação (Alert).
  const alerta = jest.spyOn(Alert, 'alert').mockImplementation((_titulo, _msg, botoes) => {
    botoes?.find((b) => b.style !== 'cancel')?.onPress?.();
  });

  // Bruno pede o projetor da Ana para hoje (e amanhã, se for no mesmo mês).
  await entrarComo(BRUNO);
  await abrir('/item/3/alugar');
  await screen.findByText('Toque no dia da retirada.');
  const hoje = hojeISO();
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const fim = toISODate(amanha).slice(0, 7) === hoje.slice(0, 7) ? toISODate(amanha) : hoje;
  fireEvent.press(screen.getByTestId(`calendario.day_${hoje}`));
  fireEvent.press(screen.getByTestId(`calendario.day_${fim}`));
  await screen.findByText('Resumo');
  fireEvent.press(screen.getByRole('button', { name: /A partir das 18h/ }));
  fireEvent.press(screen.getByRole('button', { name: /^Enviar pedido/ }));
  await screen.findByText('Aguardando o dono responder ao seu pedido.');

  const [pedido] = await listarAlugueis(BRUNO, 'locatario', ['solicitado']).then((l) => l.filter((a) => a.item_id === 3));
  // Retirada a partir das 18h: o dia da retirada não é cobrado (mínimo de 1 diária).
  expect(pedido.valor_total).toBe(3000);

  // Troca de conta como no app: sai (volta ao login) e entra como Ana.
  await act(async () => {
    await useSession.getState().signOut();
  });
  await screen.findByText('Contas de demonstração');
  await entrarComo(ANA);
  await screen.findByText('Olá, Ana!');
  await ir(`/aluguel/${pedido.id}`);
  for (const acao of ['Aprovar', 'Confirmar retirada', 'Confirmar devolução', 'Finalizar aluguel']) {
    fireEvent.press(await screen.findByRole('button', { name: acao }));
  }
  fireEvent.press(await screen.findByRole('button', { name: 'Avaliar Bruno' }));

  await screen.findByText('Como foi alugar com Bruno?');
  fireEvent.press(screen.getByRole('button', { name: 'Nota 5 de 5' }));
  await screen.findByText('Excelente');
  fireEvent.press(screen.getByRole('button', { name: 'Enviar avaliação' }));
  await screen.findByText('Aluguel concluído. As avaliações ajudam a comunidade a confiar em vocês.');
  await screen.findByText('Ana Souza');
  expect(screen.queryByRole('button', { name: 'Avaliar Bruno' })).toBeNull();

  alerta.mockRestore();
});
