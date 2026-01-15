// main/api/trpc/[trpc].ts
import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../server/routers'; 
import { createContext } from '../../server/_core/context'; 

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    // This logs errors to your Vercel dashboard so you can find bugs easily
    console.error('TRPC Error:', error);
  },
});
