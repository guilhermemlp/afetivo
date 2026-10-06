import { z } from 'zod';

/** Perfil local — existe um por dispositivo/conta (uso pessoal, 1 pessoa). */
export const profileSchema = z.object({
  id: z.literal('local'),
  /** Nome exibido; `null` = ainda não informado (nada hardcoded). */
  displayName: z.string().min(1).max(80).nullable().default(null),
  notes: z.string().max(2000).nullable().default(null),
  /** Preferência de lembretes leves; a permissão de notificação é separada. */
  remindersOptIn: z.boolean().default(false),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});
export type UserProfile = z.infer<typeof profileSchema>;

export const PROFILE_ID = 'local' as const;

export function createDefaultProfile(now = Date.now()): UserProfile {
  return profileSchema.parse({ id: PROFILE_ID, createdAt: now, updatedAt: now });
}

export function parseProfile(value: unknown): UserProfile {
  return profileSchema.parse(value);
}
