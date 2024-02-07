import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';

import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import './localization.js';
import Loading from './pages/components/general/loading.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={ <Loading />}/>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
