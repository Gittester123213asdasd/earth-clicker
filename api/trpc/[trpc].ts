// api/trpc/[trpc].ts
import { createNextApiHandler } from '@trpc/server/adapters/next';

// CHANGE THESE TWO LINES:
import { appRouter } from '../../server/routers'; 
import { createContext } from '../../server/_core/context'; // Adjusted to match your '_core' folder

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    console.error('TRPC Error:', error);
  },
});
