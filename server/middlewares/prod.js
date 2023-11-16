// Node.js imports
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import { DOCROOT, SOURCEPATH } from '../../base.config.js'

// Common methods, shared between dev and prod middlewares
import {
  getClientModule,
  getParameter,
  resolveUrl,
  resolveWrapper,
  sendClientModule,
} from './common.js';


// Require function needed to import JSON (manifests below)
// @see https://nodejs.org/dist/latest-v18.x/docs/api/esm.html#no-require-exports-or-moduleexports
const require = createRequire(import.meta.url);

// Read server manifest
const ssrPath = path.resolve(`${SOURCEPATH}/../dist`);
// console.log(`Server-side rendering from: ${ssrPath}`);
const serverManifestPath = path.join(ssrPath, '/manifest.json');
const serverManifest = fs.existsSync(serverManifestPath)
  ? require(serverManifestPath)
  : {};

// Read client manifest
const clientPath = path.resolve(`${DOCROOT}/dist`);
// console.log(`Client-side rendering from: ${clientPath}`);
const clientManifestPath = path.join(clientPath, '/manifest.json');
const clientManifest = fs.existsSync(clientManifestPath)
  ? require(clientManifestPath)
  : {};

// Read wrappers; allowing components to use string rather than object
const wrappersPath = path.join(ssrPath, '/wrappers/index.js');
const wrappers = fs.existsSync(wrappersPath)
  ? await import(`file://${wrappersPath}`)
  : {};

export default async (req, res, next) => {
  const url = req.originalUrl;

  // Resolve component, and mode, from URL
  const { component, ssr } = resolveUrl(url);

  // Check if component exists, by analysing server manifest
  let serverFile;
  if (serverManifest[component]) {
    // console.log(`Found in server manifest: ${component}`);
    ({ file: serverFile } = serverManifest[component]);
  } else {
    // Not found in server manifest
    return res.status(404).end(`Component not found in manifest: ${component}`);
  }

  // Ensure file referenced by manifest actually exists
  const componentPath = path.resolve(`${ssrPath}/${serverFile}`);
  if (fs.existsSync(componentPath)) {
    console.log(`${ssr ? 'Server-side rendering' : 'Sending client'}: ${component}`);

    // Read the component, and associated wrapper
    const {
      ssr: {
        Component,
        wrapper: componentWrapper,
      },
    } = await import(`file://${componentPath}`);

    // Read parameter, render function and template from wrapper
    const {
      parameter,
      renderClient,
      renderServer,
      template,
    } = resolveWrapper(component, componentWrapper, wrappers);

    // Read props, if supplied
    const props = getParameter(req, 'props', {});

    // Check if requesting client module
    if (!ssr) {
      // Get code for client module
      let code;
      if (clientManifest[component]) {
        // console.log(`Found in client manifest: ${component}`);
        const { file: clientFile } = clientManifest[component];
        // Generate a simple JavaScript to import the component from the client build
        code = `import * as c from "http://projectbe/dist/${clientFile}"; `
        code += 'const ssr = Object.values(c).find(({ type }) => type === \'ssr\'); ';
      }      
      return sendClientModule(req, res, code, parameter);
    }
    
    try {
      // 1. Render the component HTML. This assumes the component's exported `render` function
      //    calls appropriate framework SSR APIs, e.g.ReactDOMServer.renderToString()
      const componentHtml = renderServer
        ? await renderServer(Component, props)
        : null;

      // 2. Inject the component-rendered HTML into the component's template.  If there
      //    is no template defined then the HTML from the component is used
      const html = template
        ? template(req.body[parameter], componentHtml, getClientModule(req, renderClient))
        : componentHtml;

      // 3. Send the rendered HTML back.
      return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      // If an error is caught
      return next(e);
    }
  }

  return res.status(404).end();
};
