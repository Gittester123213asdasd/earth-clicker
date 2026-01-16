import { createNextApiHandler } from '@trpc/server/adapters/next';
import { clickerRouter } from '../../../server/routers/clicker';
import { router } from '../../../server/_core/trpc';

const appRouter = router({
  clicker: clickerRouter,
});

export default createNextApiHandler({
  router: appRouter,
  createContext: ({ req, res }: any) => ({ req, res }),
  onError: ({ path, error }) => {
    console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
  },
});
