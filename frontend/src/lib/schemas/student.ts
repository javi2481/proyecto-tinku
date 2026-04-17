import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const createStudentSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, 'Ingresá un nombre o apodo.')
    .max(40, 'Nombre muy largo.'),
  birth_year: z.coerce
    .number()
    .int()
    .min(2010, 'Año mínimo: 2010.')
    .max(2025, 'Año máximo: 2025.')
    .refine((y) => y <= currentYear, 'El año no puede ser futuro.'),
  current_grade: z.enum(['grade_1', 'grade_2', 'grade_3']),
  avatar_id: z.enum(['avatar_01', 'avatar_02', 'avatar_03', 'avatar_04', 'avatar_05', 'avatar_06']),
  consent_accepted: z.literal('true', {
    errorMap: () => ({ message: 'Tenés que aceptar el consentimiento para continuar.' }),
  }),
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  first_name: z.string().trim().min(1).max(40),
  current_grade: z.enum(['grade_1', 'grade_2', 'grade_3']),
  avatar_id: z.enum(['avatar_01', 'avatar_02', 'avatar_03', 'avatar_04', 'avatar_05', 'avatar_06']),
});
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
