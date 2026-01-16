import { createNextApiHandler } from '@trpc/server/adapters/next';
import { clickerRouter } from '../../../server/routers/clicker';
import { router } from '../../../server/_core/trpc';

// We define the main router here directly since you don't have an _app.ts
const appRouter = router({
  clicker: clickerRouter,
});

export default createNextApiHandler({
  router: appRouter,
  // We use a safe context function
  createContext: ({ req, res }: any) => ({ req, res }),
  onError: ({ path, error }: { path?: string; error: any }) => {
    console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
  },
});
