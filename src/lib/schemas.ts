import { z } from 'zod';

// ── Memory / Life Event ──────────────────────────────────────────────────────
export const LifeEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(10000).optional().default(''),
  date: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  period: z.enum([
    'early_childhood', 'childhood', 'teenage',
    'young_adult', 'middle_adult', 'later_adult',
  ]).nullable().optional(),
  category: z.enum([
    'family', 'education', 'career', 'relationship',
    'achievement', 'challenge', 'milestone', 'travel', 'health', 'other',
  ]).nullable().optional(),
  emotions: z.string().max(500).nullable().optional(),
  interviewId: z.string().nullable().optional(),
});

export type LifeEventInput = z.infer<typeof LifeEventSchema>;

// ── Person ───────────────────────────────────────────────────────────────────
export const PersonSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).refine(
    (val) => /^[A-Za-zÀ-ÖØ-öø-ÿ\u0590-\u05FF\s'-]+$/.test(val),
    'Name must contain only letters'
  ),
  relationship: z.enum([
    'Person', 'Mother', 'Father', 'Brother', 'Sister', 'Wife', 'Husband',
    'Son', 'Daughter', 'Grandmother', 'Grandfather', 'Uncle', 'Aunt',
    'Cousin', 'Friend', 'Teacher/Mentor', 'Colleague', 'Neighbor',
  ]).default('Person'),
});

export type PersonInput = z.infer<typeof PersonSchema>;

// ── Profile ──────────────────────────────────────────────────────────────────
export const ProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  fullName: z.string().max(100).nullable().optional(),
  birthDate: z.string().nullable().optional(),
  birthPlace: z.string().max(200).nullable().optional(),
  language: z.enum(['en', 'es', 'fr', 'de', 'he', 'ru', 'zh', 'ja']).default('en'),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

// ── Chat Message ─────────────────────────────────────────────────────────────
export const ChatMessageSchema = z.object({
  interviewId: z.string().optional(),
  message: z.string().max(5000).optional(),
  startNew: z.boolean().optional(),
  saveOpening: z.string().optional(),
  chatContext: z.string().optional(),
});

// ── Share ─────────────────────────────────────────────────────────────────────
export const ShareSchema = z.object({
  title: z.string().max(200).optional(),
  isPublic: z.boolean().default(false),
  password: z.string().max(100).optional(),
  expiresIn: z.enum(['7d', '30d', '90d']).optional(),
  periods: z.array(z.string()).optional(),
});

// ── Validation helper ─────────────────────────────────────────────────────────
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const error = result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
  return { success: false, error };
}
