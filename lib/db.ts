import 'server-only';
import { neon } from '@neondatabase/serverless';

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL não configurada.');
  }
  return neon(connectionString);
}
