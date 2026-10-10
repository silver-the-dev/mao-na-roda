import { z } from 'zod';

const email = z.string().trim().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.');

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, 'Informe sua senha.'),
});

export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(2, 'Informe seu nome.').max(60, 'Use no máximo 60 letras.'),
    email,
    senha: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
    confirmarSenha: z.string().min(1, 'Repita a senha.'),
    bairro: z.string().trim().min(2, 'Informe seu bairro.'),
    cidade: z.string().trim().min(2, 'Informe sua cidade.'),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas não são iguais.',
    path: ['confirmarSenha'],
  });

/** @typedef {z.infer<typeof loginSchema>} LoginForm */
/** @typedef {z.infer<typeof cadastroSchema>} CadastroForm */
