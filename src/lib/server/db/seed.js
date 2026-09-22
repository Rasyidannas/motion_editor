import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { eq } from 'drizzle-orm';
import { frames, elements } from './schema.js'

// Load .env for local runs; in Docker DATABASE_URL comes from ENV instead
if (!process.env.DATABASE_URL && existsSync('./.env')) {
  const env = readFileSync('./.env', 'utf8').trim().split('\n').reduce((acc, line) => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) acc[key] = rest.join('=');
    return acc;
  }, /** @type {Record<string, string>} */ ({}));
  Object.assign(process.env, env);
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = new Database(process.env.DATABASE_URL);
const db = drizzle(client, { schema: await import('./schema.js') });

export const seedFrames = async (/** @type {any} */ db) => {
  const existing = await db.select().from(frames).where(eq(frames.title, "Test"));
  if (existing.length === 0) {
    await db.insert(frames).values({ title: "Test" });
  } else {
    await db.update(frames).set({ title: "Test" }).where(eq(frames.id, existing[0].id));
  }
  return existing.length === 0 ? (await db.select().from(frames).where(eq(frames.title, "Test")))[0].id : existing[0].id;
}

export const seedElements = async (/** @type {any} */ db, /** @type {string} */ frameId) => {
  const existing = await db.select().from(elements).where(eq(elements.title, "Rectangle"));
  if (existing.length === 0) {
    await db.insert(elements).values({ 
      title: "Rectangle", 
      type: "rectangle", 
      frameId,
      value: { svg: '<svg width="300" height="130" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="100" x="10" y="10" rx="20" ry="20" fill="blue" /></svg>' }
    });
  } else {
    await db.update(elements).set({ 
      title: "Rectangle", 
      type: "rectangle", 
      frameId,
      value: { svg: '<svg width="300" height="130" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="100" x="10" y="10" rx="20" ry="20" fill="blue" /></svg>' } 
    }).where(eq(elements.id, existing[0].id));
  }
}

const frameId = await seedFrames(db);
await seedElements(db, frameId);
