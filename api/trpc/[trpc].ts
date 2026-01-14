const { createNextApiHandler } = require('@trpc/server/adapters/next');
const { appRouter } = require('../../../server/trpc/routers');
const { createContext } = require('../../../server/server_core/context');

module.exports = createNextApiHandler({
  router: appRouter,
  createContext,
  // This helps you see the REAL error in your Vercel logs
  onError({ error }) {
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      console.error('Something went wrong:', error);
    }
  },
});
