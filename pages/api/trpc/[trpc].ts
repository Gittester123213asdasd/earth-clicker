import { createNextApiHandler } from '@trpc/server/adapters/next';
// We use the direct path to the clicker router
import { clickerRouter } from '../../../server/routers/clicker';
import { router } from '../../../server/_core/trpc';

// We create the appRouter right here so we don't need a separate _app.ts file
const appRouter = router({
  clicker: clickerRouter,
});

export default createNextApiHandler({
  router: appRouter,
  createContext: ({ req, res }: any) => ({ req, res }),
  // We use 'any' here specifically to stop the "implicitly has an any type" build error
  onError: (opts: any) => {
    const errorPath = opts.path || 'unknown';
    const errorMsg = opts.error?.message || 'No message';
    console.error(`❌ tRPC failed on ${errorPath}: ${errorMsg}`);
  },
});
