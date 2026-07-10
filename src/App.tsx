import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { NotebookPage } from '@/pages/NotebookPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/note/:id" element={<NotebookPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppLayout>
  );
}
