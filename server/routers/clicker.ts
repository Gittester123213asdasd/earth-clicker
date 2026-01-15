import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getGlobalCounter,
  getCountryLeaderboard,
  incrementAll,
  getOnlineUserCount,
} from "../db";

export const clickerRouter = router({
  getGlobalCounter: publicProcedure.query(async () => {
    const counter = await getGlobalCounter();
    return counter?.totalClicks || 0;
  }),

  submitClickBatch: publicProcedure
    .input(z.object({ count: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await incrementAll(ctx.req, input.count);
        return { success: true };
      } catch (error) {
        console.error("Batch Update Failed:", error);
        throw new Error("Could not sync clicks");
      }
    }),

  getLeaderboard: publicProcedure.query(async ({ ctx }) => {
    if (ctx.res) {
      ctx.res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    }
    const leaderboard = await getCountryLeaderboard();
    return leaderboard.map((item: any, index: number) => ({
      rank: index + 1,
      countryCode: item.country || "UN",
      totalClicks: item.totalClicks || 0,
    }));
  }),

  // ADD THESE TWO SO HOME.TSX WORKS:
  getUserStats: publicProcedure.query(async ({ ctx }) => {
     // This just returns basic info for the frontend
     const country = ctx.req?.headers?.['x-vercel-ip-country'] || 'UN';
     return { totalClicks: 0, country }; 
  }),

  getUserCountryRank: publicProcedure.query(async () => {
     return { rank: 1 }; // Placeholder so the UI doesn't break
  }),

  getOnlineUsers: publicProcedure.query(async () => {
    return await getOnlineUserCount();
  }),
});
