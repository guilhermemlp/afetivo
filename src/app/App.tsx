import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Skeleton } from '@/components/ui';
import { AppShell } from './AppShell';
import { NotFoundPage } from './NotFoundPage';

const TodayPage = lazy(() =>
  import('@/features/today/TodayPage').then((module) => ({ default: module.TodayPage })),
);
const JournalPage = lazy(() =>
  import('@/features/journal/JournalPage').then((module) => ({ default: module.JournalPage })),
);
const PatternsPage = lazy(() =>
  import('@/features/patterns/PatternsPage').then((module) => ({
    default: module.PatternsPage,
  })),
);
const MedicationsPage = lazy(() =>
  import('@/features/medications/MedicationsPage').then((module) => ({
    default: module.MedicationsPage,
  })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
);

function RouteFallback() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Carregando…</span>
      <Skeleton size="h-8 w-48" />
      <Skeleton size="h-64 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <Suspense fallback={<RouteFallback />}>
              <TodayPage />
            </Suspense>
          }
        />
        <Route
          path="diario"
          element={
            <Suspense fallback={<RouteFallback />}>
              <JournalPage />
            </Suspense>
          }
        />
        <Route
          path="padroes"
          element={
            <Suspense fallback={<RouteFallback />}>
              <PatternsPage />
            </Suspense>
          }
        />
        <Route
          path="medicacoes"
          element={
            <Suspense fallback={<RouteFallback />}>
              <MedicationsPage />
            </Suspense>
          }
        />
        <Route
          path="ajustes"
          element={
            <Suspense fallback={<RouteFallback />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
