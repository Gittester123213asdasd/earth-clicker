import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getGlobalCounter,
  getCountryLeaderboard,
  getCountryStats,
  getUserStats,
  initializeGlobalCounter,
  initializeCountry,
  incrementGlobalCounter,
  incrementCountryStats,
  incrementUserClicks,
  updateOnlineStatus,
  getOnlineUserCount,
} from "../db";

const RATE_LIMIT_WINDOW = 1000;
const RATE_LIMIT_MAX_CLICKS = 20; // Increased to 20 for more "intense" clicking feel
const recentClicks: Map<number, number[]> = new Map();

function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  const userClicks = recentClicks.get(userId) || [];
  const recentUserClicks = userClicks.filter((time) => now - time < RATE_LIMIT_WINDOW);
  if (recentUserClicks.length >= RATE_LIMIT_MAX_CLICKS) return false;
  recentUserClicks.push(now);
  recentClicks.set(userId, recentUserClicks);
  return true;
}

// Improved helper: Fallback only if the frontend fails to send a country
async function getCountryFromIp(ip: string) {
  try {
    const cleanIp = ip.split(',')[0].trim();
    // Use a faster, no-key API for server-side fallback
    const res = await fetch(`http://ip-api.com/json/${cleanIp}`);
    const data = await res.json();
    
    if (data.status === "fail") {
       return { country: "US", countryName: "United States" };
    }
    return { country: data.countryCode, countryName: data.country };
  } catch (e) {
    return { country: "US", countryName: "United States" };
  }
}

export const clickerRouter = router({
  getGlobalCounter: publicProcedure.query(async ({ ctx }) => {
    const ip = (ctx.req.headers["x-forwarded-for"] as string) || ctx.req.socket.remoteAddress || "unknown";
    await updateOnlineStatus(ip);
    await initializeGlobalCounter();
    const counter = await getGlobalCounter();
    return counter?.totalClicks || 0;
  }),

  getOnlineUsers: publicProcedure.query(async () => {
    return await getOnlineUserCount();
  }),

  submitClick: publicProcedure
    .input(z.object({ country: z.string().length(2).optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id || 1; // In a real app, use session IDs to distinguish users
      const ip = (ctx.req.headers["x-forwarded-for"] as string) || ctx.req.socket.remoteAddress || "unknown";
      
      await updateOnlineStatus(ip);

      if (!checkRateLimit(userId)) {
        throw new Error("Whoa! Slow down a bit.");
      }

      try {
        await initializeGlobalCounter();
        
        // Priority: 1. Input from Frontend, 2. Geo-IP, 3. Default US
        let userCountry = input.country;
        
        if (!userCountry) {
          const geo = await getCountryFromIp(ip);
          userCountry = geo.country;
        }

        // We don't need to fetch Country Name every time (saves speed)
        // Just initialize and increment
        await initializeCountry(userCountry, userCountry); 
        await incrementGlobalCounter();
        await incrementCountryStats(userCountry);
        await incrementUserClicks(userId, userCountry);

        return {
          success: true,
          detectedCountry: userCountry,
        };
      } catch (error) {
        console.error("Error submitting click:", error);
        throw new Error("Failed to submit click");
      }
    }),

  getLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ input }) => {
      const leaderboard = await getCountryLeaderboard(input.limit);
      return leaderboard.map((country: any, index: number) => ({
        rank: index + 1,
        countryCode: country.countryCode,
        totalClicks: country.totalClicks,
      }));
    }),

  getUserStats: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id || 1;
    const stats = await getUserStats(userId);
    return {
      userId: userId,
      totalClicks: stats?.totalClicks || 0,
      country: stats?.country || "US",
    };
  }),

  getUserCountryRank: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id || 1;
    const userStats = await getUserStats(userId);
    const country = userStats?.country || "US";

    const leaderboard = await getCountryLeaderboard(250);
    const countryRank = leaderboard.findIndex((c: any) => c.countryCode === country);

    return {
      rank: countryRank >= 0 ? countryRank + 1 : null,
      country: country,
    };
  }),
});