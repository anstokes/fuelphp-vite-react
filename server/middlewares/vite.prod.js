// Node.js imports
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { getProps, resolveWrapper } from './vite.common.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Client-side rendering path and URL
const clientEnabled = true;
const clientPath = path.resolve(`${__dirname}../../../../../../public/dist`);
const clientUrl = 'http://projectbe/dist';
// console.log(`Client-side rendering from: ${clientPath} (${clientUrl})`);

// Server-side rendering path
const ssrPath = path.resolve(`${__dirname}../../../../../app/react/dist`);
// console.log(`Server-side rendering from: ${ssrPath}`);

// Require function needed to import JSON (manifests below)
// @see https://nodejs.org/dist/latest-v18.x/docs/api/esm.html#no-require-exports-or-moduleexports
const require = createRequire(import.meta.url);

// Read client manifest
const clientManifestPath = path.join(clientPath, '/manifest.json');
const clientManifest = (clientEnabled && fs.existsSync(clientManifestPath))
  ? require(clientManifestPath)
  : {};

// Read server manifest
const serverManifestPath = path.join(clientPath, '/manifest.json');
const serverManifest = fs.existsSync(serverManifestPath)
  ? require(path.join(ssrPath, '/manifest.json'))
  : {};

// Read wrappers; allows components to use string rather than object
const wrappersPath = path.join(ssrPath, '/wrappers/index.js');
const wrappers = fs.existsSync(wrappersPath)
  ? await import(`file://${wrappersPath}`)
  : {};

export default async (req, res, next) => {
  const url = req.originalUrl;

  // React component is the remaining path parts, minus the query string
  const pathSegments = url.split('/').slice(2);
  const [component] = pathSegments.join('/').split('?');

  // Check if component exists, by analysing server manifest
  let clientModule;
  let serverFile;
  if (serverManifest[component]) {
    // console.log(`Found in server manifest: ${component}`);
    ({ file: serverFile } = serverManifest[component]);
  } else {
    // Not found in server manifest
    return res.status(404).end();
  }

  // Check whether only using server-side rendering, or whether there is an associated client
  // module which should be loaded by the client
  if (clientEnabled && clientManifest[component]) {
    // console.log(`Found in client manifest: ${component}`);
    const { file: clientFile } = clientManifest[component];
    clientModule = `${clientUrl}/${clientFile}`;
  }

  // Ensure file referenced by manifest actually exists
  const componentPath = path.resolve(`${ssrPath}/${serverFile}`);
  if (fs.existsSync(componentPath)) {
    console.log(`Server-side rendering: ${component}`);

    // Read the component, and associated wrapper
    const {
      default: Component,
      wrapper: componentWrapper,
    } = await import(`file://${componentPath}`);

    // Read parameter, render function and template from wrapper
    const {
      parameter,
      renderServer: render,
      template,
    } = resolveWrapper(component, componentWrapper, wrappers);

    // Read props, if supplied
    const props = getProps(req);

    try {
      // 1. Render the component HTML. This assumes the component's exported `render` function
      //    calls appropriate framework SSR APIs, e.g.ReactDOMServer.renderToString()
      const componentHtml = render
        ? await render(Component, props)
        : null;

      // 2. Inject the component-rendered HTML into the component's template.  If there
      //    is no template defined then the HTML from the component is used
      const html = template
        ? template(req.body[parameter], componentHtml, clientModule)
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
