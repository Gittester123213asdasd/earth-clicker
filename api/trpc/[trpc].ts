import { createNextApiHandler } from '@trpc/server/adapters/next';
// We point to the .ts files. Vercel's builder handles the conversion.
import { appRouter } from '../../server/trpc/routers'; 
import { createContext } from '../../server/server_core/context'; 

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    console.error('TRPC Error:', error);
  },
});
