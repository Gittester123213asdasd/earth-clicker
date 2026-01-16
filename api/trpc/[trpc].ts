import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../../server/routers/_app';
import { createContext } from '../../../server/_core/trpc';

// This handles all the database requests
export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
  },
});
