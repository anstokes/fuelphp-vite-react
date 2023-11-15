import { useState } from 'react';
// Example of bundling assets
import '../assets/css/App.css';
import '../assets/css/index.css';
import reactLogo from '../assets/img/react.svg';
// Example of using external/public assets
import fuelphpLogo from '../../public/img/fuelphp.png';
import viteLogo from '../../public/img/vite.svg';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://fuelphp.com/" target="_blank" rel="noreferrer">
          <img src={fuelphpLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>FuelPHP, Vite &amp; React</h1>
      <div className="card">
        <button
          onClick={() => setCount(count + 1)}
          type="button"
        >
          count is
          {' '}
          {count}
        </button>
        <p>
          Edit
          {' '}
          <code>src/App.jsx</code>
          {' '}
          and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the FuelPHP, Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
