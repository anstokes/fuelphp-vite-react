import React from 'react';
import ReactDOMServer from 'react-dom/server';

export default function RenderServerSide(Component, props) {
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </React.StrictMode>,
  );
}
