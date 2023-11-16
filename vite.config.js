import { defineConfig, splitVendorChunkPlugin } from 'vite';
// import react from '@vitejs/plugin-react-swc'
import react from '@vitejs/plugin-react';

// Live reload support
import liveReload from 'vite-plugin-live-reload';

// Node Path
import path from 'node:path';

// Glob
// @see https://github.com/mrmlnc/fast-glob
import fg from 'fast-glob';

// Directory paths for consistency with FuelPHP
import { DOCROOT, SOURCEPATH } from './base.config';

// Check if creating SSR build
const ssr = process.env.VITE_SSR?.toLowerCase() === 'true';
// console.log(`SSR: ${ssr ? 'ENABLED' : 'DISABLED'}`);

// Paths to scan for React components
/*
const inDir = ssr
  ? ['components/*.jsx', 'wrappers/*']
  : ['client-entry-points/*.jsx'];
*/
const inDir = ['client-entry-points/*.jsx', 'components/*.jsx', 'wrappers/*'];

// Output directory, based on build mode
const outDir = ssr
  ? path.resolve(`${SOURCEPATH}/../dist`)
  : `${DOCROOT}/dist`;

// Dynamically generate inputs
const getInputs = () => fg
  .globSync(inDir, {
    cwd: SOURCEPATH,
  })
  .map((file) => path.resolve(SOURCEPATH, file));

// https://vitejs.dev/config/
export default defineConfig({

  plugins: [
    // Live reload pages on changes
    // @see https://github.com/arnoson/vite-plugin-live-reload#readme
    liveReload([
      // FuelPHP application directory
      // `${APPPATH}/**/*.php`,
      // Public directory
      `${DOCROOT}/**/*.php`,
    ]),
    react(),
    splitVendorChunkPlugin(),
  ],

  // Base public path
  // @see https://vitejs.dev/config/shared-options.html#base
  base: process.env.VITE_ENV === 'development'
    ? '/'
    : '/dist/',

  build: {
    // Output directory for production build
    // @see https://v2.vitejs.dev/config/#build-outdir
    outDir,
    emptyOutDir: true,

    // Emit manifest so PHP can find the hashed files
    // @see https://v2.vitejs.dev/config/#build-manifest
    manifest: true,

    // Directly customise the underlying Rollup bundle
    // @see https://v2.vitejs.dev/config/#build-rollupoptions
    rollupOptions: {
      // input: path.resolve(`${APPPATH}/react/src/main.jsx`),
      input: getInputs(),
      output: {
        // sourcemap: true,
      },
    },
  },

  esbuild: {
    // minifyIdentifiers: false,
  },

  // Directory to serve as plain static assets (relative to root below)
  // @see https://v2.vitejs.dev/config/#publicdir
  publicDir: '../public',

  resolve: {
    alias: {
    },
  },

  // Project root directory
  // @see https://vitejs.dev/config/shared-options.html#root
  root: SOURCEPATH,

  server: {
    // Specify strict port to match on PHP side
    // Tip: use different port per project to run them at the same time
    // @see https://v2.vitejs.dev/config/#server-port
    strictPort: true,
    port: 5133,

    // Define the origin of the generated asset URLs during development
    // @see https://v2.vitejs.dev/config/#server-origin
    origin: 'http://localhost:5133',
  },
});
