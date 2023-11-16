import cors from 'cors';
import express from 'express';
import { createServer as createViteServer } from 'vite';

// Middleware depending upon mode dev/prod
import { middlewarePaths } from './middlewares/common.js';
import devMiddleware from './middlewares/dev.js';
import prodMiddleware from './middlewares/prod.js';

// Check if in production mode
const prod = (process.env.VITE_ENV?.substring(0, 4)?.toLowerCase() === 'prod');

async function createServer() {
  const app = express();

  // Add CORS headers, for direct browser requests
  app.use(cors());

  // Support JSON request body
  app.use(express.json());

  if (prod) {
    // Production mode
    console.log('Serving content in production mode...');

    // Use custom middleware to serve SSR content in production mode
    app.use(middlewarePaths, prodMiddleware);
  } else {
    // Development mode
    console.log('Serving content in development mode...');

    // Create Vite server in middleware mode and configure the app type, as appropriate
    // @see https://vitejs.dev/config/shared-options.html#apptype
    const vite = await createViteServer({
      server: { middlewareMode: true },
      // appType: 'custom'
    });

    // Use custom middleware to server SSR content in development mode
    app.use(middlewarePaths, devMiddleware(vite));

    // Use Vite's connect instance as middleware. If you use your own
    // express router (express.Router()), you should use router.use
    app.use(vite.middlewares);
  }

  // Listen on the normal Vite port
  app.listen(5133);
}

createServer();
