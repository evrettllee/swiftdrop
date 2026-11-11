import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/cyrillic-500.css';
import '@fontsource/inter/cyrillic-600.css';
import '@fontsource/inter/cyrillic-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from '../routes/router';
import { bindFeedCachesToSession } from './feed-cache-session';
import { bindOrderDraftToSession } from './order-draft-session';
import { useAuthStore } from '@/shared/session';
import { initTheme } from '@/shared/lib/theme';
import '../styles/index.css';

initTheme();
// Before the session check, so no change of the session is missed.
bindOrderDraftToSession();
bindFeedCachesToSession();
void useAuthStore.getState().initialize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
