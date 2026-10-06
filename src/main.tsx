import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FolderBackupProvider } from './components/FolderBackupProvider';
import { ConfirmationProvider } from './components/ConfirmationProvider';

createRoot(document.getElementById('root')!).render(
  <ConfirmationProvider>
    <FolderBackupProvider>
      <App />
    </FolderBackupProvider>
  </ConfirmationProvider>,
);
