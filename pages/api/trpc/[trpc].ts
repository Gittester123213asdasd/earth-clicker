import { createNextApiHandler } from '@trpc/server/adapters/next';
import { clickerRouter } from '../../../server/routers/clicker';
import { router } from '../../../server/_core/trpc';

// We define the main router right here to avoid needing an _app.ts file
const appRouter = router({
  clicker: clickerRouter,
});

export default createNextApiHandler({
  router: appRouter,
  createContext: ({ req, res }: any) => ({ req, res }),
  // Using 'opts: any' to stop the "Binding element implicitly has any type" error
  onError: (opts: any) => {
    const path = opts.path;
    const error = opts.error;
    console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
  },
});
