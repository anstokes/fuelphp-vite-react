import fs from 'fs';
import path from 'path';

// Common methods, shared between dev and prod middlewares
import {
  getClientModule,
  getParameter,
  resolveUrl,
  resolveWrapper,
  sendClientModule,
} from './common.js';

// Store wrapper outside the method
let wrappers;

export default (vite) => async (req, res, next) => {
  const url = req.originalUrl;

  // Resolve component, and mode, from URL
  const { component, ssr } = resolveUrl(url);

  // Check if component exists
  const componentPath = path.resolve(`${vite.config.root}/${component}`);
  if (fs.existsSync(componentPath)) {
    console.log(`${ssr ? 'Server-side rendering' : 'Sending client'}: ${component}`);

    if (!wrappers) {
      // Read wrappers
      wrappers = await vite.ssrLoadModule(path.resolve(`${vite.config.root}/wrappers`));
    }

    // Read the component, and associated wrapper
    const {
      ssr: {
        Component,
        wrapper: componentWrapper,
      },
    } = await vite.ssrLoadModule(componentPath);

    // Find wrapper for component
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
      const { code } = await vite.transformRequest(url.replace(/^\/client/, ''));
      return sendClientModule(req, res, code, parameter);
    }

    try {
      // 1. Render the component HTML. This assumes the component's exported `render` function
      //    calls appropriate framework SSR APIs, e.g.ReactDOMServer.renderToString()
      const componentHtml = renderServer
        ? renderServer(Component, props)
        : null;

      // 2. Inject the component-rendered HTML into the component's template.  If there
      //    is no template defined then the HTML from the component is used
      let html = template
        ? template(req.body[parameter], componentHtml, getClientModule(req, renderClient))
        : componentHtml;

      // 3. (Optional) Apply Vite HTML transforms. This injects the Vite HMR client,
      //    and also applies HTML transforms from Vite plugins, e.g. global
      //    preambles from @vitejs/plugin-react
      const transform = false;
      html = transform
        ? await vite.transformIndexHtml(url, html)
        : html;

      // 4. Send the rendered HTML back.
      return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace so it maps back
      // to your actual source code.
      vite.ssrFixStacktrace(e);
      return next(e);
    }
  }

  return res.status(404).end(`Component not found: ${component}`);
};
