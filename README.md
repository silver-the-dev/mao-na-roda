# Mão na Roda

Aplicativo de **aluguel de itens entre pessoas**: ferramentas, eletrônicos,
instrumentos musicais, câmeras e utensílios. A ideia é dar acesso a itens caros
para quem não pode comprá-los: a pessoa paga uma diária reduzida em vez de
comprar. A confiança entre os usuários vem das **avaliações mútuas** e do
**histórico de aluguéis**.

Protótipo acadêmico feito em React Native com Expo. **Tudo roda no próprio
celular**: não há servidor, API nem internet envolvidos. Várias contas convivem
no mesmo banco local, e a demonstração é feita saindo de uma conta e entrando em
outra no mesmo aparelho.

---

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Tecnologias](#tecnologias)
3. [Como instalar e executar](#como-instalar-e-executar)
4. [Contas de demonstração](#contas-de-demonstração)
5. [Roteiro sugerido para a apresentação](#roteiro-sugerido-para-a-apresentação)
6. [Regras de negócio](#regras-de-negócio)
7. [Banco de dados](#banco-de-dados)
8. [Organização do código](#organização-do-código)
9. [Testes](#testes)
10. [Limitações conhecidas](#limitações-conhecidas)

---

## Funcionalidades

- **Conta**: cadastro com nome, e-mail, senha, bairro e cidade; login com
  e-mail e senha; sessão que continua aberta ao reabrir o app; botão de sair.
- **Perfil**: foto, telefone, bairro, cidade, nota média, número de avaliações e
  de aluguéis concluídos. O perfil público pode ser visto pelos outros usuários.
- **Itens**: anunciar, editar, pausar e excluir. Cada item tem título,
  descrição, categoria, até 5 fotos da galeria, valor da diária, caução
  opcional, estado de conservação, bairro e cidade.
- **Busca**: por texto (ignora acentos), categoria, faixa de preço, cidade e
  bairro.
- **Aluguel**: o locatário escolhe as datas num calendário que bloqueia os dias
  já reservados, vê o total e envia o pedido. O dono aprova ou recusa, depois
  confirma a retirada e a devolução e finaliza o aluguel.
- **Avaliações**: no fim do aluguel, cada lado avalia o outro com 1 a 5 estrelas
  e um comentário opcional.
- **Histórico**: abas **Aluguei** e **Emprestei**, com filtro por status.
- **Mensagens**: conversa entre dono e locatário dentro de cada aluguel.
- **Restaurar dados de demonstração**: botão no Perfil que apaga tudo e recria
  os dados iniciais.

> O pagamento **não** acontece no app. O valor combinado fica registrado e as
> pessoas acertam o pagamento na retirada.

## Tecnologias

| Para quê                     | Biblioteca                                   |
| ---------------------------- | -------------------------------------------- |
| App mobile                   | React Native + Expo SDK 57 (JavaScript)      |
| Navegação por arquivos       | Expo Router                                  |
| Banco de dados local         | expo-sqlite (API assíncrona, SQL direto)     |
| Fotos                        | expo-image-picker + expo-file-system         |
| Hash da senha (SHA-256)      | expo-crypto                                  |
| Sessão salva no aparelho     | AsyncStorage                                 |
| Estado da sessão             | Zustand                                      |
| Formulários e validação      | React Hook Form + Zod                        |
| Calendário                   | react-native-calendars (só JavaScript)       |
| Testes                       | Jest (jest-expo) + Testing Library           |

Tudo funciona no **Expo Go**, sem build nativo.

---

## Como instalar e executar

### Pré-requisitos

- **Node.js 20 ou mais recente** no computador.
- App **Expo Go** no celular (Android ou iPhone), atualizado. Ele precisa
  suportar o **SDK 57**.
- Computador e celular **na mesma rede Wi-Fi**.

### Passo a passo

```bash
git clone https://github.com/silver-the-dev/mao-na-roda.git
cd mao-na-roda
npm install
npx expo start
```

Vai aparecer um QR code no terminal:

- **Android**: abra o Expo Go e toque em *Scan QR code*.
- **iPhone**: aponte a câmera para o QR code e toque no link.

Na primeira abertura o app mostra "Preparando o app..." por alguns segundos:
ele cria o banco e grava os dados de demonstração.

### Se algo der errado

| Problema                                       | Solução                                                         |
| ---------------------------------------------- | --------------------------------------------------------------- |
| O celular não conecta ao computador            | `npx expo start --tunnel` (funciona mesmo em redes diferentes)  |
| Expo Go diz que o projeto é de outro SDK       | Atualize o Expo Go na loja de apps                              |
| Comportamento estranho depois de atualizar     | `npx expo start -c` (limpa o cache)                             |
| Quer voltar ao estado inicial                  | Perfil → **Restaurar dados de demonstração**                    |

### Comandos úteis

| Comando         | O que faz                                   |
| --------------- | ------------------------------------------- |
| `npm start`     | Inicia o servidor de desenvolvimento        |
| `npm test`      | Roda todos os testes                        |
| `npm run lint`  | Verifica o código com ESLint                |

---

## Contas de demonstração

Todas as contas usam a senha **`123456`**. Na tela de login há atalhos com o
nome de cada pessoa: toque no nome e depois em **Entrar**.

| Pessoa           | E-mail                | Bairro / cidade          | Itens anunciados                                                |
| ---------------- | --------------------- | ------------------------ | --------------------------------------------------------------- |
| **Ana Souza**    | ana@maonaroda.com     | Itaquera, São Paulo      | Furadeira, caixa de ferramentas, projetor, panelão              |
| **Bruno Lima**   | bruno@maonaroda.com   | Capão Redondo, São Paulo | Violão, teclado, kit de microfone, lavadora de alta pressão     |
| **Carla Mendes** | carla@maonaroda.com   | Grajaú, São Paulo        | Câmera DSLR, filmadora, notebook, cafeteira                     |
| **Diego Santos** | diego@maonaroda.com   | Pimentas, Guarulhos      | Caixa de som, kit de pintura (**pausado**), bicicleta           |

### Situações já prontas nos dados

As datas são calculadas a partir do dia em que o banco foi criado, então sempre
há aluguéis no passado, em andamento e no futuro.

| Situação                                         | Quem vê o quê                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Teclado do Bruno **em andamento** com a Ana      | Bruno confirma a devolução; há mensagens trocadas entre os dois               |
| Caixa de ferramentas da Ana **devolvida**        | Ana precisa **finalizar** o aluguel (Carla foi quem alugou)                   |
| Câmera da Carla com **pedido** do Bruno          | Carla aprova ou recusa; Bruno pode cancelar                                   |
| Bicicleta do Diego com **pedido** da Ana         | Diego aprova ou recusa (retirada a partir das 18h)                            |
| Furadeira da Ana **aprovada** para o Diego       | Os dias ficam bloqueados no calendário; Diego ainda pode cancelar             |
| Notebook da Carla **concluído** com o Diego      | Ninguém avaliou ainda: os dois podem avaliar                                  |
| Caixa de som do Diego **concluída** com a Carla  | Carla já avaliou; Diego ainda pode avaliar                                    |
| Vários aluguéis concluídos com avaliações        | Notas e comentários aparecem nos perfis                                       |
| Um pedido recusado e um cancelado                | Aparecem no filtro "Recusados e cancelados"                                   |

---

## Roteiro sugerido para a apresentação

Duração aproximada: **10 minutos**. Antes de começar, toque em **Perfil →
Restaurar dados de demonstração** para partir do estado inicial.

**1. Apresentar o problema (30 s)**
Muita gente precisa de uma furadeira ou de uma câmera por um dia e não tem como
comprar. Quem tem esses itens parados em casa pode ganhar uma renda extra.

**2. Entrar e explorar (1 min 30 s): conta do Bruno**
1. Na tela de login, toque em **Bruno** e em **Entrar**.
2. Mostre a tela Início: saudação, busca e categorias.
3. Busque **"camera"** (sem acento) para mostrar que a busca ignora acentos.
4. Abra **Filtros** e mostre a faixa de preço e a cidade.

**3. Pedir um aluguel (2 min): ainda como Bruno**
1. Volte ao Início e abra o **Projetor** da Ana.
2. Mostre as fotos, a caução, a nota da Ana e o botão **Ver perfil**.
3. Toque em **Quero alugar**, escolha dois dias no calendário e alterne entre
   **antes das 18h** e **a partir das 18h**. O total muda: retirando a partir
   das 18h, o primeiro dia não é cobrado.
4. Envie o pedido. A tela do aluguel mostra "Aguardando o dono responder".

**4. Responder como dono (2 min 30 s): conta da Ana**
1. Perfil → **Sair da conta** → entre como **Ana**.
2. Aluguéis → **Emprestei**. O pedido do Bruno aparece destacado.
3. Abra o pedido, mande uma mensagem ("Pode retirar às 19h") e toque em
   **Aprovar**.
4. Siga o fluxo: **Confirmar retirada → Confirmar devolução → Finalizar
   aluguel**. A linha do tempo registra data e hora de cada etapa.
5. Toque em **Avaliar Bruno**, dê 5 estrelas e um comentário.

**5. Mostrar as regras de negócio (2 min)**
- Abra a **Furadeira** da Ana: as datas aprovadas para o Diego aparecem em
  "Datas já reservadas" e ficam bloqueadas no calendário de quem tenta alugar.
- Na aba **Anunciar**, toque em **Anunciar novo item**, escolha fotos da
  galeria e publique. Depois mostre **Pausar** e **Excluir**.
- Entre como **Bruno** e tente **excluir o teclado**, que está alugado: o app
  explica que não é possível.
- Abra o **perfil público** de alguém para mostrar a nota média, as avaliações e
  os aluguéis concluídos.

**6. Encerrar (30 s)**
Mostre o botão **Restaurar dados de demonstração** e lembre que tudo funciona
sem internet, direto no celular.

---

## Regras de negócio

Todas ficam na camada de repositórios (`src/repositories/`), com transação
quando há mais de uma escrita. As regras puras ficam em `src/domain/` e têm
testes unitários.

| Regra                                                                         | Onde                                          |
| ----------------------------------------------------------------------------- | --------------------------------------------- |
| Ninguém aluga o próprio item                                                  | `rentals.solicitarAluguel`                    |
| Sem dois aluguéis aprovados ou em andamento com datas sobrepostas             | `domain/dateRanges` + `rentals`               |
| Ao aprovar, outros pedidos pendentes nas mesmas datas são recusados           | `rentals.aprovarAluguel`                      |
| `valor_total = diárias × valor_diaria`, calculado no repositório              | `domain/pricing`                              |
| Diárias contam a retirada e a devolução; retirando a partir das 18h, o primeiro dia não é cobrado (mínimo 1) | `domain/pricing` |
| Só o dono aprova, recusa, confirma retirada e devolução e finaliza            | `domain/rentalStatus`                         |
| Só o locatário cancela: pedido pendente a qualquer momento; aprovado até 24 h antes da retirada | `domain/rentalStatus`     |
| Avaliação só em aluguel concluído, uma por pessoa, sem edição                 | `reviews.avaliar` + restrição `UNIQUE`        |
| Nota média sempre calculada por consulta na tabela `reviews`                  | `users`, `items`, `reviews`                   |
| Item com aluguel aprovado, em andamento ou aguardando finalização não pode ser excluído | `items.excluirItem`                  |
| Exclusão de item é lógica (status `excluido`): o histórico continua           | `items.excluirItem`                           |
| E-mail único, sem diferenciar maiúsculas                                      | `users` + `UNIQUE COLLATE NOCASE`             |

**Status do aluguel**

```
solicitado ──► aprovado ──► em_andamento ──► devolvido ──► concluido
    │              │
    ├─► recusado   └─► cancelado (locatário, até 24 h antes)
    └─► cancelado (locatário)
```

---

## Banco de dados

SQLite local (`maonaroda.db`) com `PRAGMA foreign_keys = ON`.

| Tabela        | Conteúdo                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `users`       | id, nome, email (único), senha_hash, foto_uri, telefone, bairro, cidade, criado_em              |
| `items`       | id, dono_id, titulo, descricao, categoria, valor_diaria, caucao, conservacao, bairro, cidade, status, texto_busca, criado_em |
| `item_photos` | id, item_id, uri, ordem                                                                         |
| `rentals`     | id, item_id, dono_id, locatario_id, data_inicio, data_fim, retirada_apos_corte, valor_total, status, criado_em, respondido_em, retirado_em, devolvido_em, concluido_em, cancelado_em |
| `reviews`     | id, rental_id, autor_id, avaliado_id, nota, comentario, criado_em; `UNIQUE (rental_id, autor_id)` |
| `messages`    | id, rental_id, autor_id, texto, criado_em                                                       |

- **Datas** em texto ISO 8601. Datas de aluguel em `AAAA-MM-DD`; momentos em
  data e hora UTC. Na tela, tudo aparece como `dd/MM/aaaa`.
- **Dinheiro** em inteiros de centavos. Na tela, aparece em reais.
- **Índices** em todas as chaves estrangeiras.
- **Migrações**: a versão do esquema fica em `PRAGMA user_version`. Ao abrir o
  app, `src/db/migrations.js` aplica, dentro de transação, as migrações que
  faltam.
- **Fotos**: copiadas para `<documentos do app>/fotos`. O banco guarda só o
  caminho do arquivo.
- **Dados de demonstração**: `src/db/seed.js`, gravados na primeira execução e
  ao restaurar.

**Colunas além da especificação original**

- `items.texto_busca`: título e descrição sem acentos, para a busca.
- `rentals.retirada_apos_corte`: guarda se a retirada é a partir das 18h.
- As datas de cada etapa do aluguel, usadas na linha do tempo.

---

## Organização do código

```
app/                    Telas (Expo Router: cada arquivo é uma rota)
  (auth)/               Login e cadastro
  (tabs)/               Início, Aluguéis, Anunciar, Perfil
  item/                 Novo item, detalhe, editar, solicitar aluguel
  aluguel/[id]/         Detalhe do aluguel e avaliação
  usuario/[id].js       Perfil público
  perfil/editar.js      Editar meu perfil
src/
  db/                   Conexão, migrações e dados de demonstração
  repositories/         SQL e regras de negócio (um arquivo por entidade)
  domain/               Regras puras: valor, datas, status do aluguel
  components/           Componentes de interface reutilizáveis
  hooks/                useFocusQuery (recarrega os dados ao abrir a tela)
  schemas/              Validação dos formulários (Zod)
  store/                Sessão (Zustand + AsyncStorage)
  theme/                Cores, espaçamentos e tipografia
  types/                Tipos em JSDoc
  utils/                Formatação (R$, datas), fotos e hash
assets/seed/            Ilustrações dos itens de demonstração
__tests__/              Testes das telas
```

As telas **nunca** executam SQL: sempre chamam funções de `src/repositories/`.

---

## Testes

```bash
npm test
```

| Tipo                                  | Arquivo                                           | Cobre                                                         |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| Unitários de cálculo do valor         | `src/domain/__tests__/pricing.test.js`            | Diárias, regra das 18h, virada de mês e de ano                |
| Unitários de sobreposição de datas    | `src/domain/__tests__/dateRanges.test.js`         | Sobreposição, dias bloqueados, validação do período           |
| Unitários de status                   | `src/domain/__tests__/rentalStatus.test.js`       | Permissões por papel, prazo de cancelamento, linha do tempo   |
| Integração dos repositórios           | `src/repositories/__tests__/repositories.test.js` | Todas as regras de negócio com SQL real (SQLite em memória)   |
| Formulários                           | `src/schemas/__tests__/schemas.test.js`           | Validações do Zod                                             |
| Telas                                 | `__tests__/telas.test.js`                         | Todas as telas e o fluxo completo de aluguel pela interface   |

---

## Limitações conhecidas

- **Protótipo local**: os dados ficam só no aparelho. Contas criadas num celular
  não existem em outro.
- **Sem pagamento**: o app só registra o valor combinado.
- **Senha**: guardada como hash SHA-256 simples, sem recuperação de senha nem
  verificação de e-mail. Suficiente para um protótipo acadêmico, mas não para
  produção.
- **Só celular**: a versão web não é suportada, porque o armazenamento de fotos
  depende do sistema de arquivos do aparelho.
- **Sem notificações**: quem recebe um pedido vê o destaque ao abrir a aba
  Aluguéis.
