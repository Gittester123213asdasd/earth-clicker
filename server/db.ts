import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc, sql } from 'drizzle-orm';

// 1. Setup the Connection (Fixed for new Neon driver)
const client = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client });

// 2. Table Definitions
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  openId: text('open_id').unique(), // Stores IP address for guests
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

// 3. Helper to get IP/Country from Vercel
function getVisitorInfo(req: any) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || '127.0.0.1';
  const country = req.headers['x-vercel-ip-country'] || 'UN';
  return { ip, country };
}

// 4. Database Functions
export async function getGlobalCounter() {
  try {
    const result = await db.select().from(globalStats).where(eq(globalStats.id, 1));
    return result[0] || { totalClicks: 0 };
  } catch (e) {
    return { totalClicks: 0 };
  }
}

export async function incrementAll(req: any) {
  const { ip, country } = getVisitorInfo(req);

  // Update Global Total
  await db.insert(globalStats)
    .values({ id: 1, totalClicks: 1 })
    .onConflictDoUpdate({
      target: globalStats.id,
      set: { totalClicks: sql`total_clicks + 1`, updatedAt: new Date() }
    });

  // Update User/IP Total
  await db.insert(users)
    .values({ 
      openId: ip, 
      country: country, 
      totalClicks: 1 
    })
    .onConflictDoUpdate({
      target: users.openId,
      set: { 
        totalClicks: sql`total_clicks + 1`, 
        updatedAt: new Date() 
      }
    });
}

export async function getCountryLeaderboard() {
  // Sums clicks by country code for the leaderboard
  return await db.select({
    country: users.country,
    totalClicks: sql<number>`sum(${users.totalClicks})`,
  })
  .from(users)
  .groupBy(users.country)
  .orderBy(desc(sql`sum(${users.totalClicks})`))
  .limit(10);
}

// Keeping these to prevent errors in other files
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
