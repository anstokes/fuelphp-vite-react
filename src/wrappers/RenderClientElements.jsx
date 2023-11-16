import React from 'react';
import ReactDOM from 'react-dom/client';

export default function RenderClientElements(targetElements, Component, props, ssr) {
  targetElements.forEach((targetElement) => {
    // Define component
    const ReactComponent = (
      <React.StrictMode>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...props} />
      </React.StrictMode>
    );

    // If using SSR then hydrate, otherwise render
    if (ssr) {
      ReactDOM.hydrateRoot(targetElement, ReactComponent);
    } else {
      ReactDOM.createRoot(targetElement).render(ReactComponent);
    }
  });
}
