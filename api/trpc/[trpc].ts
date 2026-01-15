// api/trpc/[trpc].ts
import { createNextApiHandler } from '@trpc/server/adapters/next';
// Try adding the explicit index if the folder import is failing
import { appRouter } from '../../server/trpc/routers/index'; 
import { createContext } from '../../server/server_core/context'; 

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      console.error('Unhandled TRPC Error:', error);
    }
  },
});
