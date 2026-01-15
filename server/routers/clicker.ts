// server/trpc/routers/clicker.ts
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getGlobalCounter,
  getCountryLeaderboard,
  incrementAll,
  getOnlineUserCount,
} from "../db";

export const clickerRouter = router({
  // 1. Get Global Total
  getGlobalCounter: publicProcedure.query(async () => {
    const counter = await getGlobalCounter();
    return counter?.totalClicks || 0;
  }),

  // 2. Submit Batch (The Cost-Saver)
  submitClickBatch: publicProcedure
    .input(z.object({ count: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // We pass the batch total to the DB
        await incrementAll(ctx.req, input.count);
        return { success: true };
      } catch (error) {
        console.error("Batch Update Failed:", error);
        throw new Error("Could not sync clicks");
      }
    }),

  // 3. Leaderboard (Cached for 30s to save money)
  getLeaderboard: publicProcedure.query(async ({ ctx }) => {
    if (ctx.res) {
      // Prevents the DB from being hit more than twice a minute
      ctx.res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    }
    const leaderboard = await getCountryLeaderboard();
    return leaderboard.map((item: any, index: number) => ({
      rank: index + 1,
      countryCode: item.country || "UN",
      totalClicks: item.totalClicks || 0,
    }));
  }),

  getOnlineUsers: publicProcedure.query(async () => {
    return await getOnlineUserCount();
  }),
});
