import path from 'path';
import { createNextApiHandler } from '@trpc/server/adapters/next';

// In "type": "module", we use import instead of require
// We MUST add the .js extension for local files to be found on Vercel
import { appRouter } from '../../../server/trpc/routers.js';
import { createContext } from '../../../server/server_core/context.js';

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      console.error('TRPC Error:', error);
    }
  },
});
