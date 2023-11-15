export function getProps(req, source) {
  switch (source) {
    case 'query':
      try {
        const { props: propsString } = req.query;
        const props = propsString
          ? JSON.parse(propsString)
          : {};
        return props;
      } catch (e) {
        console.log(`Ignoring malformed props: ${req.body.props}`);
        return {};
      }

    case 'body':
    default:
      return req.body.props || {};
  }
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
