import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc, sql } from 'drizzle-orm';

// 1. Connection (Using the modern Drizzle-Neon adapter config)
const client = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client });

// 2. Table Definitions
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

// 3. Robust Helper for IP/Country Tracking
function getVisitorInfo(req: any) {
  // Use optional chaining to prevent the "Cannot read properties of undefined" error
  const ip = req?.headers?.['x-forwarded-for']?.split(',')[0] || '127.0.0.1';
  const country = req?.headers?.['x-vercel-ip-country'] || 'UN';
  return { ip, country };
}

// 4. Optimized Database Functions
export async function getGlobalCounter() {
  try {
    const result = await db.select().from(globalStats).where(eq(globalStats.id, 1));
    return result[0] || { totalClicks: 0 };
  } catch (e) {
    console.error("Global counter fetch error:", e);
    return { totalClicks: 0 };
  }
}

export async function incrementAll(req: any) {
  const { ip, country } = getVisitorInfo(req);

  // Use a transaction or sequential execution for atomic updates
  try {
    // Increment Global
    await db.insert(globalStats)
      .values({ id: 1, totalClicks: 1 })
      .onConflictDoUpdate({
        target: globalStats.id,
        set: { 
          totalClicks: sql`${globalStats.totalClicks} + 1`, 
          updatedAt: new Date() 
        }
      });

    // Increment User/IP
    await db.insert(users)
      .values({ 
        openId: ip, 
        country: country, 
        totalClicks: 1 
      })
      .onConflictDoUpdate({
        target: users.openId,
        set: { 
          totalClicks: sql`${users.totalClicks} + 1`, 
          updatedAt: new Date() 
        }
      });
  } catch (e) {
    console.error("Increment error:", e);
  }
}

export async function getCountryLeaderboard() {
  try {
    // Explicitly cast sum result to number
    return await db.select({
      country: users.country,
      totalClicks: sql<number>`CAST(sum(${users.totalClicks}) AS INTEGER)`,
    })
    .from(users)
    .groupBy(users.country)
    .orderBy(desc(sql`sum(${users.totalClicks})`))
    .limit(10);
  } catch (e) {
    console.error("Leaderboard fetch error:", e);
    return [];
  }
}

// Compatibility fallbacks
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

export async function updateOnlineStatus() { return 1; }
export async function getOnlineUserCount() { return 1; }
