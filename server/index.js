import express from 'express';
import { createServer as createViteServer } from 'vite';

// Middleware depending upon mode dev/prod
import viteDev from './middlewares/vite.dev.js';
import viteProd from './middlewares/vite.prod.js';

// Check if in production mode
const prod = (process.env.VITE_ENV?.substring(0, 4)?.toLowerCase() === 'prod');

async function createServer() {
  const app = express();

  // Support JSON request body
  app.use(express.json());

  if (prod) {
    // Production mode
    console.log('Serving content in production mode...');

    // Serve SSR content
    app.use('/ssr', viteProd);
  } else {
    // Development mode
    console.log('Serving content in development mode...');

    // Create Vite server in middleware mode and configure the app type, as appropriate
    // @see https://vitejs.dev/config/shared-options.html#apptype
    const vite = await createViteServer({
      server: { middlewareMode: true },
      // appType: 'custom'
    });

    // Use custom middleware to SSR in development mode
    app.use('/ssr', viteDev(vite));

    // Use Vite's connect instance as middleware. If you use your own
    // express router (express.Router()), you should use router.use
    app.use(vite.middlewares);
  }

  // Listen on the normal Vite port
  app.listen(5133);
}

createServer();
