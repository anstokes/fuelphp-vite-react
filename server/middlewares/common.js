import { v4 } from 'uuid';

// Session handler
import session from "./session.js";

// Prefixes/paths
export const clientPath = '/client';
export const ssrPath = '/ssr';
export const middlewarePaths = [clientPath, ssrPath];

export function getClientModule(req, renderClient) {
  const requestUrl = `${req.protocol}://${req.get('host')}`;

  // Client module is the component served directly (without SSR) by the same server
  /*
  let qs = `?${parameter}=${encodeURIComponent(getParameter(req, parameter, ''))}`;
  qs += `&props=${encodeURIComponent(JSON.stringify(props))}`;
  */
  const serverRequestUuid = v4();
  const clientModule = renderClient
    ? `${requestUrl}${req.originalUrl.replace(/^\/ssr/, '/client')}?uuid=${serverRequestUuid}`
    : null;
  
  if (clientModule) {
    // Store body in session, for client module
    session.set(serverRequestUuid, req.body);
  }
  
  return clientModule;
}

export function getParameter(req, parameter, defaultValue, source) {
  switch (source) {
    case 'query':
      return req.query[parameter] || defaultValue;

    case 'body':
    default:
      return req.body[parameter] || defaultValue;
  }
}

export function resolveUrl(url) {
  // React component is the remaining path parts, minus the query string
  const pathSegments = url.split('/');
  const [component] = pathSegments.slice(2).join('/').split('?');

  // Check if sending SSR or client module
  const ssr = (ssrPath === pathSegments.slice(0, 2).join('/'));

  return {
    component,
    ssr,
  };
}

export function resolveWrapper(component, componentWrapper, wrappers) {
  if (componentWrapper) {
    // If string, then attempt to find wrapper
    if (typeof (componentWrapper) === 'string') {
      return wrappers[componentWrapper];
    }

    if (typeof (componentWrapper) === 'object') {
      return componentWrapper;
    }
  }

  // Unable to resolve wrapper
  console.log(`Wrapper not defined on component: ${component}`);
  return {};
}

export function sendClientModule(req, res, code, parameter) {
  if (code) {
    const originalUuid = getParameter(req, 'uuid', '', 'query');
    const originalRequest = { body: session.get(originalUuid) };
    if (!originalRequest.body) {
      return res.status(405).end(`Unable to find session: ${originalUuid}`);
    }

    // Remove session; one time use only
    session.remove(originalUuid);

    // Build the initialiser statement
    // The client initialiser method should use hydrateRoot is used to 'attach' React to
    // existing HTML that was already SSR'd.
    let initialiser = 'ssr.wrapper.renderClient(';
    initialiser += `"${getParameter(originalRequest, parameter, '')}", ssr.Component, `;
    initialiser += `${JSON.stringify(getParameter(originalRequest, 'props', {}))}, true);`;

    // Inject the initialiser into the component code
    return res.status(200)
      .set({ 'Content-Type': 'text/javascript' })
      .end(`${code}${initialiser}`);
  }
  
  // Component does not have a client module, shouldn't have been requested
  return res.status(405).end('Component does not have a client-side module');
}
