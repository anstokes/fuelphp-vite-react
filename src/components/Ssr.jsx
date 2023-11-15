import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import byId from '../wrappers/byId';

export default function App({ name }) {
  const [content, setContent] = useState(name);

  useEffect(() => {
    setContent('def');
  }, [setContent]);

  return (
    <div>
      {`Hello ${content}!`}
    </div>
  );
}

App.propTypes = {
  name: PropTypes.string,
};

App.defaultProps = {
  name: '',
};

// Define wrapper to use when building
// export const wrapper = 'byId';
export const wrapper = byId;
