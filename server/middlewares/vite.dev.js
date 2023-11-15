import fs from 'fs';
import path from 'path';

import { getProps, resolveWrapper } from './vite.common.js';

// Store wrapper outside the method
let wrappers;

export default (vite) => async (req, res, next) => {
  const requestUrl = `${req.protocol}://${req.get('host')}`;
  const url = req.originalUrl;

  // React component is the remaining path parts, minus the query string
  const pathSegments = url.split('/').slice(2);
  const [component] = pathSegments.join('/').split('?');

  // Check if component exists
  const componentPath = path.resolve(`${vite.config.root}/${component}`);
  if (fs.existsSync(componentPath)) {
    console.log(`Server-side rendering: ${component}`);

    if (!wrappers) {
      // Read wrappers
      wrappers = await vite.ssrLoadModule(path.resolve(`${vite.config.root}/wrappers`));
    }

    // Read the component, and associated wrapper
    const {
      default: Component,
      wrapper: componentWrapper,
    } = await vite.ssrLoadModule(componentPath);

    // Find wrapper for component
    const {
      parameter,
      renderServer,
      template,
    } = resolveWrapper(component, componentWrapper, wrappers);

    // Read props, if supplied
    const props = getProps(req);

    // Client module is the component served directly (without SSR) by this server
    let clientModule;
    const entryPoint = component.replace(/^components\//, 'client-entry-points/');
    if (fs.existsSync(path.resolve(`${vite.config.root}/${entryPoint}`))) {
      clientModule = `${requestUrl}/${entryPoint}`;
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
        ? template(req.body[parameter], componentHtml, clientModule)
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

  return res.status(404).end();
};
