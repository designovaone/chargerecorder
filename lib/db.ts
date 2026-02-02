import { neon } from '@neondatabase/serverless';

let _sql: ReturnType<typeof neon> | null = null;

/**
 * Gets the database connection, initializing it lazily.
 * This prevents build-time errors when NEON_DATABASE_URL is not set.
 */
function getSql() {
  if (!_sql) {
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error('NEON_DATABASE_URL is not set');
    }
    _sql = neon(process.env.NEON_DATABASE_URL);
  }
  return _sql;
}

// Export sql as a tagged template function that lazily initializes
export const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  return getSql()(strings, ...values);
};
