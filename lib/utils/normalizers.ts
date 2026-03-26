import { z } from 'zod';

/**
 * Ensures strict canonical email format: trimmed and lowercase.
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Creates URL-safe slugs from strings (e.g., for tags or posts)
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD') // split accented characters
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
}

/**
 * Base Zod Schema applying the normalizing transform directly to the boundary
 */
export const emailSchema = z
  .string()
  .min(1, { message: "Email is required" })
  .email("Invalid email address")
  .transform(normalizeEmail);
