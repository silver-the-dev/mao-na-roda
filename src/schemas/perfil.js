import { z } from 'zod';

export const perfilSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.').max(60, 'Use no máximo 60 letras.'),
  telefone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{10,11}$/.test(v.replace(/\D/g, '')), 'Informe o telefone com DDD. Exemplo: (11) 98765-4321'),
  bairro: z.string().trim().min(2, 'Informe seu bairro.'),
  cidade: z.string().trim().min(2, 'Informe sua cidade.'),
});

/** @typedef {z.infer<typeof perfilSchema>} PerfilForm */

export const avaliacaoSchema = z.object({
  nota: z.number().int().min(1, 'Toque nas estrelas para dar uma nota.').max(5),
  comentario: z.string().trim().max(500, 'Use no máximo 500 caracteres.'),
});

/** @typedef {z.infer<typeof avaliacaoSchema>} AvaliacaoForm */
