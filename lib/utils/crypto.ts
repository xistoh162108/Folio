import crypto from 'crypto'

/**
 * Generates a standard random hex token for verification parameters.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Uses SHA-256 rather than bcrypt for extremely fast server-side token 
 * hashing against DB strings, sufficient since the raw tokens are high-entropic.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
