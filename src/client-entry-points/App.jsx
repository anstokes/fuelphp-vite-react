import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../components/App';

console.log(document.getElementsByClassName('fuelphp-vite-react-example'));
Array.from(document.getElementsByClassName('fuelphp-vite-react-example'))
  .forEach((element) => {
    ReactDOM.createRoot(element).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
