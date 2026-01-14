import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
// We only import the functions that exist in our new db.ts
import {
  getGlobalCounter,
  getCountryLeaderboard,
  incrementAll,
  getOnlineUserCount,
} from "../db";

const RATE_LIMIT_WINDOW = 1000;
const RATE_LIMIT_MAX_CLICKS = 20; 
const recentClicks: Map<string, number[]> = new Map();

// Rate limit based on IP since we don't have logins
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userClicks = recentClicks.get(ip) || [];
  const recentUserClicks = userClicks.filter((time) => now - time < RATE_LIMIT_WINDOW);
  
  if (recentUserClicks.length >= RATE_LIMIT_MAX_CLICKS) return false;
  
  recentUserClicks.push(now);
  recentClicks.set(ip, recentUserClicks);
  return true;
}

export const clickerRouter = router({
  getGlobalCounter: publicProcedure.query(async () => {
    const counter = await getGlobalCounter();
    return counter?.totalClicks || 0;
  }),

  getOnlineUsers: publicProcedure.query(async () => {
    return await getOnlineUserCount();
  }),

  submitClick: publicProcedure
    .mutation(async ({ ctx }) => {
      // Get IP from the request context
      const ip = (ctx.req.headers["x-forwarded-for"] as string) || "127.0.0.1";

      if (!checkRateLimit(ip)) {
        throw new Error("Whoa! Slow down a bit.");
      }

      try {
        // This one function now handles Global + User + Country + IP tracing
        await incrementAll(ctx.req);

        return {
          success: true
        };
      } catch (error) {
        console.error("Error submitting click:", error);
        throw new Error("Failed to submit click");
      }
    }),

  getLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async () => {
      const leaderboard = await getCountryLeaderboard();
      return leaderboard.map((item: any, index: number) => ({
        rank: index + 1,
        countryCode: item.country || "UN",
        totalClicks: item.totalClicks || 0,
      }));
    }),

  // Simplified stats for guests
  getUserStats: publicProcedure.query(async ({ ctx }) => {
    const ip = (ctx.req.headers["x-forwarded-for"] as string) || "127.0.0.1";
    // You can add a getUserByOpenId(ip) call here if you want to show personal clicks
    return {
      totalClicks: 0, 
      country: ctx.req.headers["x-vercel-ip-country"] || "UN",
    };
  }),
});
