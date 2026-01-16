import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import * as db from './db';

export const clickerRouter = router({
  getGlobalCounter: publicProcedure.query(async () => {
    const stats = await db.getGlobalCounter();
    return stats.totalClicks;
  }),

  getUserStats: publicProcedure.query(async ({ ctx }) => {
    const { ip, country } = ctx;
    // You'll need to implement this in db.ts to fetch by IP
    const user = await db.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.openId, ip)
    });
    return user || { totalClicks: 0, country };
  }),

  getLeaderboard: publicProcedure.query(async () => {
    return await db.getCountryLeaderboard();
  }),

  getUserCountryRank: publicProcedure.query(async ({ ctx }) => {
    const { ip } = ctx;
    // Simplified rank logic
    return { rank: 1 }; 
  }),

  getOnlineUsers: publicProcedure.query(async () => {
    return await db.getOnlineUserCount();
  }),

  // THIS IS THE CRITICAL MUTATION
  submitClickBatch: publicProcedure
    .input(z.object({ count: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.incrementAll(ctx.req, input.count);
      return { success: true };
    }),
});
