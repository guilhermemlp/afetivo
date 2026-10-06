import { Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { NotFoundPage } from './NotFoundPage';
import { TodayPage } from '@/features/today/TodayPage';
import { JournalPage } from '@/features/journal/JournalPage';
import { PatternsPage } from '@/features/patterns/PatternsPage';
import { MedicationsPage } from '@/features/medications/MedicationsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="diario" element={<JournalPage />} />
        <Route path="padroes" element={<PatternsPage />} />
        <Route path="medicacoes" element={<MedicationsPage />} />
        <Route path="ajustes" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
