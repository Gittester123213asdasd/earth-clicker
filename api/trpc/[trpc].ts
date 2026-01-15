import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../server/routers'; 
// Note: Changed from server_core to _core to match your folder list
import { createContext } from '../../server/_core/context'; 

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      console.error('TRPC Error:', error);
    }
  },
});
