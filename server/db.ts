import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc, sql } from 'drizzle-orm';

// Table Definitions
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

// --- SDK COMPATIBILITY FUNCTIONS ---

export async function getUserByOpenId(openId: string | null) {
  // If openId is null, we return null to satisfy sdk.ts(278,7)
  if (!openId) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId));
  return result[0] || null;
}

// Added 'email' and 'name' as optional to satisfy sdk.ts(262,11)
export async function upsertUser(data: { 
  openId: string; 
  country: string; 
  totalClicks: number; 
  name?: string | null;
  email?: string | null;
}) {
  return await db.insert(users)
    .values({
      openId: data.openId,
      country: data.country,
      totalClicks: data.totalClicks,
      name: data.name || 'Guest'
    })
    .onConflictDoUpdate({
      target: users.openId,
      set: { 
        totalClicks: sql`users.total_clicks + ${data.totalClicks}`,
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

    // Ensure we pass a string for openId
    await upsertUser({ openId: String(ip), country, totalClicks: amount });
  } catch (e) {
    console.error("DB Error:", e);
    throw e;
  }
}

export async function getCountryLeaderboard() {
  try {
    const result = await db.select({
      countryCode: users.country,
      totalClicks: sql<number>`CAST(sum(${users.totalClicks}) AS INTEGER)`,
    })
    .from(users)
    .groupBy(users.country)
    .orderBy(desc(sql`sum(${users.totalClicks})`))
    .limit(10);
    
    return result || [];
  } catch (e) { return []; }
}

export async function getOnlineUserCount() { return 1; }
