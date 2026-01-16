import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import * as db from '../db';

export const clickerRouter = router({
  getGlobalCounter: publicProcedure.query(async () => {
    return await db.getGlobalCounter();
  }),

  getUserStats: publicProcedure.query(async ({ ctx }: any) => {
    // We use a fallback IP if the headers are missing to prevent the Cookie error
    const ip = ctx.req?.headers?.['x-forwarded-for']?.split(',')[0] || '127.0.0.1';
    const user = await db.getUserByOpenId(ip);
    const country = ctx.req?.headers?.['x-vercel-ip-country'] || 'UN';
    
    return {
      totalClicks: user?.totalClicks || 0,
      country: user?.country || country
    };
  }),

  getLeaderboard: publicProcedure.query(async () => {
    return await db.getCountryLeaderboard();
  }),

  getUserCountryRank: publicProcedure.query(async () => {
    return { rank: 1 }; 
  }),

  getOnlineUsers: publicProcedure.query(async () => {
    return 1;
  }),

  submitClickBatch: publicProcedure
    .input(z.object({ count: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      return await db.incrementAll(ctx.req, input.count);
    }),
});
