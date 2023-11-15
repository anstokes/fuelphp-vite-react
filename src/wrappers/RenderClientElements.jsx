import React from 'react';
import ReactDOM from 'react-dom/client';

const ssr = false;

export default function RenderClientElements(targetElements, Component, props) {
  targetElements.forEach((targetElement) => {
    // If using SSR then hydrate, otherwise render
    ReactDOM.createRoot(targetElement)[ssr ? 'hydrate' : 'render'](
      <React.StrictMode>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...props} />
      </React.StrictMode>,
    );
  });
}
