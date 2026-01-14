import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../../server/trpc/routers'; // Adjust if your routers are in a different spot
import { createContext } from '../../../server/trpc/_core/context'; // We found this in your list!

export default createNextApiHandler({
  router: appRouter,
  createContext,
});
