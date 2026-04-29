import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});

// Detect the URL prefix the SPA is mounted at, so deep links work whether the
// build is served from `/app/` (Hostinger), `/visuallearn/backend/public/app/`
// (local XAMPP), or any other prefix. The marker is `/app` in the path.
function detectRouterBase(): string {
  const path = window.location.pathname;
  const m = path.match(/^(.*\/app)(?:\/.*)?$/);
  return m ? m[1] : '';
}
const routerBase = detectRouterBase();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={routerBase}>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
