import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../server/trpc/routers.js';
import { createContext } from '../../server/server_core/context.js';

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      console.error('TRPC Server Error:', error);
    }
  },
});
