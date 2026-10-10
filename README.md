# Mão na Roda

Aplicativo de aluguel de itens entre pessoas (ferramentas, eletrônicos,
instrumentos musicais, câmeras, utensílios). Protótipo acadêmico em React Native
com Expo: todos os dados ficam no próprio aparelho (SQLite), sem servidor.

> As instruções completas, as contas de demonstração e o roteiro da apresentação
> serão escritos na etapa 9.

## Como rodar

1. Instale o Node.js 20 ou mais recente.
2. Instale o app **Expo Go** no celular (Android ou iOS). Ele precisa ser compatível com o **Expo SDK 57**.
3. No terminal, dentro da pasta do projeto:

   ```bash
   npm install
   npx expo start
   ```

4. Leia o QR code com o Expo Go (Android) ou com a câmera (iOS).
   O computador e o celular precisam estar na mesma rede Wi-Fi.
   Se a rede bloquear a conexão, use `npx expo start --tunnel`.

## Scripts

| Comando        | O que faz                         |
| -------------- | --------------------------------- |
| `npm start`    | Inicia o servidor de desenvolvimento |
| `npm test`     | Roda os testes unitários (Jest)   |
| `npm run lint` | Verifica o código com ESLint      |
