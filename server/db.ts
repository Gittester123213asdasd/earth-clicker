import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc } from 'drizzle-orm';

// 1. Setup the Database Connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// 2. Define your tables (Matches your db.json structure)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  openId: text('open_id').unique(),
  name: text('name'),
  totalClicks: integer('total_clicks').default(0),
  country: text('country'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const globalStats = pgTable('global_stats', {
  id: integer('id').primaryKey(),
  totalClicks: integer('total_clicks').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Updated Functions (Talking to Neon instead of JSON)
export async function getUserByOpenId(openId: string) {
  const result = await db.select().from(users).where(eq(users.openId, openId));
  return result[0];
}

export async function upsertUser(userData: any) {
  await db.insert(users).values(userData).onConflictDoUpdate({
    target: users.openId,
    set: { ...userData, updatedAt: new Date() }
  });
}

export async function getGlobalCounter() {
  const result = await db.select().from(globalStats).where(eq(globalStats.id, 1));
  return result[0] || { totalClicks: 0 };
}

export async function incrementGlobalCounter() {
  await db.insert(globalStats).values({ id: 1, totalClicks: 1 })
    .onConflictDoUpdate({
      target: globalStats.id,
      set: { totalClicks: sql`total_clicks + 1`, updatedAt: new Date() }
    });
}

export async function getCountryLeaderboard() {
  // For now, this gets users sorted by clicks
  return await db.select().from(users).orderBy(desc(users.totalClicks)).limit(10);
}

// Dummy functions to prevent crashes in other files
export async function updateOnlineStatus() { return 1; }
export async function getOnlineUserCount() { return 1; }
