import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { frames } from './schema.js'

// Load .env
const env = readFileSync('./.env', 'utf8').trim().split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) acc[key] = rest.join('=');
  return acc;
}, {});
Object.assign(process.env, env);

const client = new Database(process.env.DATABASE_URL);
const db = drizzle(client, { schema: await import('./schema.js') });

export const seedFrames = async (db) => {
  await db.insert(frames).values({ title: "Test" })
}

await seedFrames(db)
