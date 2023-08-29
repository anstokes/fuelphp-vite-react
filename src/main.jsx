import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Array.from(document.getElementsByTagName('react-example'))
Array.from(document.getElementsByClassName('react-example'))
  .forEach((element) => {
    ReactDOM.createRoot(element).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )  
  });