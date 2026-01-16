import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc, sql } from 'drizzle-orm';

// Table Definitions (Must be defined before the functions)
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

// Initialize Database connection
const client = neon(process.env.DATABASE_URL!);
// Fixed: passing client directly and including schema reference
export const db = drizzle(client, { schema: { users, globalStats } });

function getVisitorInfo(req: any) {
  // Check common proxy headers for Vercel
  const ip = req?.headers?.['x-forwarded-for']?.split(',')[0] || '127.0.0.1';
  const country = req?.headers?.['x-vercel-ip-country'] || 'UN';
  return { ip, country };
}

// Optimized Database Functions
export async function getGlobalCounter() {
  try {
    const result = await db.select().from(globalStats).where(eq(globalStats.id, 1));
    return result[0] || { totalClicks: 0 };
  } catch (e) {
    console.error("Fetch Global Counter error:", e);
    return { totalClicks: 0 };
  }
}

export async function incrementAll(req: any, amount: number = 1) {
  const { ip, country } = getVisitorInfo(req);

  try {
    // 1. Increment Global Total by the batch amount
    await db.insert(globalStats)
      .values({ id: 1, totalClicks: amount })
      .onConflictDoUpdate({
        target: globalStats.id,
        set: { 
          totalClicks: sql`total_clicks + ${amount}`, 
          updatedAt: new Date() 
        }
      });

    // 2. Increment User/IP Total by the batch amount
    await db.insert(users)
      .values({ 
        openId: ip, 
        country: country, 
        totalClicks: amount 
      })
      .onConflictDoUpdate({
        target: users.openId,
        set: { 
          totalClicks: sql`total_clicks + ${amount}`, 
          updatedAt: new Date() 
        }
      });
  } catch (e) {
    console.error("Increment error:", e);
  }
}

export async function getCountryLeaderboard() {
  try {
    return await db.select({
      country: users.country,
      totalClicks: sql<number>`CAST(sum(${users.totalClicks}) AS INTEGER)`,
    })
    .from(users)
    .groupBy(users.country)
    .orderBy(desc(sql`sum(${users.totalClicks})`))
    .limit(10);
  } catch (e) {
    console.error("Leaderboard error:", e);
    return [];
  }
}

// Online count fallbacks
export async function updateOnlineStatus() { return 1; }
export async function getOnlineUserCount() { return 1; }
