import { defineConfig, splitVendorChunkPlugin } from 'vite'
// import react from '@vitejs/plugin-react-swc'
import react from '@vitejs/plugin-react'

// Live reload support
import liveReload from 'vite-plugin-live-reload'

// Path
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({

  plugins: [
    react(),
    // Live reload pages on changes
    // @see https://github.com/arnoson/vite-plugin-live-reload#readme
    liveReload([
      // FuelPHP application directory
      __dirname + '../../../app/**/*.php',
      // Public directory
      __dirname + '../../../../public/**/*.php',      
    ]),
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
    outDir: '../../../../public/dist',
    emptyOutDir: true,

    // Emit manifest so PHP can find the hashed files
    // @see https://v2.vitejs.dev/config/#build-manifest
    manifest: true,

    // Directly customise the underlying Rollup bundle
    // @see https://v2.vitejs.dev/config/#build-rollupoptions
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.jsx'),
    }
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
  root: 'src',

  server: {
    // Specify strict port to match on PHP side
    // Tip: use different port per project to run them at the same time
    // @see https://v2.vitejs.dev/config/#server-port
    strictPort: true,
    port: 5133,
    
    // Define the origin of the generated asset URLs during development
    // @see https://v2.vitejs.dev/config/#server-origin
    origin: 'http://localhost:5133'
  },  
})
