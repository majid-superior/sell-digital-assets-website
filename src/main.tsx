import './config/zod.ts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import App from './App.tsx';
import { queryClient } from './services/queryClient.ts';
import { ThemeProvider } from './provider/ThemeProvider.tsx';
import { AuthProvider } from './provider/AuthProvider.tsx';
import { websiteThemeService, organizationService } from './services/index.ts';

// Bootstrap dynamic database theme tokens (0ms cached paint + background sync)
websiteThemeService.initThemeBootstrap();
// Bootstrap dynamic database organization title & metadata (0ms cached paint + background sync)
organizationService.initOrganizationBootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
);
