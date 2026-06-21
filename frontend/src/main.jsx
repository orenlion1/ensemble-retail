import React from 'react';
import { createRoot } from 'react-dom/client';
import { matchRoutes, createBrowserRouter, RouterProvider } from 'react-router-dom';
import {
  initializeFaro,
  createReactRouterV6DataOptions,
  ReactIntegration,
  getWebInstrumentations,
  withFaroRouterInstrumentation
} from '@grafana/faro-react';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import App from './App.jsx';
import './styles.css';

const defaultFaroUrl = 'https://faro-collector-prod-us-east-3.grafana.net/collect/5a68e2237d01ef9a66c697cd87090b55';
const faroUrl = import.meta.env.VITE_FARO_URL || defaultFaroUrl;
const faroApiKey = import.meta.env.VITE_FARO_API_KEY;

if (faroUrl) {
  initializeFaro({
    url: faroUrl,
    apiKey: faroApiKey,
    app: {
      name: 'ensemble-grafana',
      version: '1.0.0',
      environment: import.meta.env.VITE_FARO_ENVIRONMENT || 'production'
    },
    instrumentations: [...getWebInstrumentations({
      captureConsole: true
    }),
    new TracingInstrumentation(),
    new ReactIntegration({
      router: createReactRouterV6DataOptions({
        matchRoutes
      })
    })]
  });
}

const reactBrowserRouter = createBrowserRouter([
  {
    path: '*',
    element: <App />
  }
], {
  future: {
    v7_startTransition: true
  }
});

const browserRouter = withFaroRouterInstrumentation(reactBrowserRouter);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={browserRouter} future={{ v7_startTransition: true }} />
  </React.StrictMode>
);
