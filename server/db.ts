import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc, sql } from 'drizzle-orm';

// 1. Connection logic
const sqlConnection = neon(process.env.DATABASE_URL!);
export const db = drizzle(sqlConnection);

// 2. Updated Table Definitions
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  openId: text('open_id').unique(), // Used for IP address or Guest ID
  name: text('name').default('Guest'),
  totalClicks: integer('total_clicks').default(0),
  country: text('country').default('UN'), // UN = Unknown
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const globalStats = pgTable('global_stats', {
  id: integer('id').primaryKey(),
  totalClicks: integer('total_clicks').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Helper to get Visitor Data from Vercel Headers
function getVisitorInfo(req?: any) {
  if (!req) return { ip: 'unknown', country: 'UN' };
  
  // Vercel provides these headers automatically
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || '127.0.0.1';
  const country = req.headers['x-vercel-ip-country'] || 'UN';
  return { ip, country };
}

// 4. Functional Logic
export async function getGlobalCounter() {
  const result = await db.select().from(globalStats).where(eq(globalStats.id, 1));
  return result[0] || { totalClicks: 0 };
}

export async function incrementGlobalCounter() {
  // Use "upsert" to ensure the counter exists and increments atomically
  await db.insert(globalStats)
    .values({ id: 1, totalClicks: 1 })
    .onConflictDoUpdate({
      target: globalStats.id,
      set: { 
        totalClicks: sql`total_clicks + 1`, 
        updatedAt: new Date() 
      }
    });
}

export async function incrementUserClicks(req: any) {
  const { ip, country } = getVisitorInfo(req);
  
  // Identify the user by IP (since there is no login)
  return await db.insert(users)
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
  // Groups users by country and sums their clicks
  return await db.select({
    country: users.country,
    totalClicks: sql<number>`sum(${users.totalClicks})`,
  })
  .from(users)
  .groupBy(users.country)
  .orderBy(desc(sql`sum(${users.totalClicks})`))
  .limit(10);
}

// Dummy online status (simplified for Serverless)
export async function updateOnlineStatus() { return 1; }
export async function getOnlineUserCount() { return 1; }
