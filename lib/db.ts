import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

/**
 * Gets the database connection, initializing it lazily.
 * This prevents build-time errors when NEON_DATABASE_URL is not set.
 */
export function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error('NEON_DATABASE_URL is not set');
    }
    _sql = neon(process.env.NEON_DATABASE_URL);
  }
  return _sql;
}

// For convenience, also export a default sql object that uses the getter
export const sql = new Proxy({} as NeonQueryFunction<false, false>, {
  get(_target, prop) {
    return getSql()[prop as keyof NeonQueryFunction<false, false>];
  },
});
