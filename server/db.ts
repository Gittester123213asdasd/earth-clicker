import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc, sql } from 'drizzle-orm';

// Match Neon SQL
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  openId: text('open_id').unique(),
  name: text('name').default('Guest'),
  totalClicks: integer('total_clicks').default(0),
  country: text('country').default('UN'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const globalStats = pgTable('global_stats', {
  id: integer('id').primaryKey(),
  totalClicks: integer('total_clicks').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const client = neon(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema: { users, globalStats } });

// --- SDK COMPATIBILITY ---
export async function getUserByOpenId(openId: string | null) {
  try {
    if (!openId) return null;
    const result = await db.select().from(users).where(eq(users.openId, openId));
    return result[0] ? { ...result[0], openId: result[0].openId || "" } : null;
  } catch (e) { return null; }
}

export async function upsertUser(data: { 
  openId: string; 
  country?: string; 
  totalClicks?: number; 
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  lastSignedIn?: any;
}) {
  return await db.insert(users)
    .values({
      openId: data.openId,
      country: data.country || 'UN',
      totalClicks: data.totalClicks || 0,
      name: 'Guest'
    })
    .onConflictDoUpdate({
      target: users.openId,
      set: { 
        totalClicks: data.totalClicks ? sql`users.total_clicks + ${data.totalClicks}` : sql`users.total_clicks`,
        updatedAt: new Date() 
      }
    });
}

// --- MAIN FUNCTIONS ---
function getVisitorInfo(req: any) {
  const ip = (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0] || '127.0.0.1';
  const country = (req?.headers?.['x-vercel-ip-country'] as string) || 'UN';
  return { ip, country };
}

export async function getGlobalCounter() {
  try {
    const result = await db.select().from(globalStats).where(eq(globalStats.id, 1));
    return result[0]?.totalClicks || 0;
  } catch (e) { return 0; }
}

export async function incrementAll(req: any, amount: number = 1) {
  const { ip, country } = getVisitorInfo(req);
  try {
    await db.insert(globalStats)
      .values({ id: 1, totalClicks: amount }) 
      .onConflictDoUpdate({
        target: globalStats.id,
        set: { totalClicks: sql`global_stats.total_clicks + ${amount}`, updatedAt: new Date() }
      });
    await upsertUser({ openId: String(ip), country, totalClicks: amount });
    return { success: true };
  } catch (e) {
    console.error("Increment Error:", e);
    throw e;
  }
}

export async function getCountryLeaderboard() {
  try {
    return await db.select({
      countryCode: users.country,
      totalClicks: sql<number>`CAST(sum(${users.totalClicks}) AS INTEGER)`,
    })
    .from(users)
    .groupBy(users.country)
    .orderBy(desc(sql`sum(${users.totalClicks})`))
    .limit(10);
  } catch (e) { return []; }
}

export async function getOnlineUserCount() { return 1; }
