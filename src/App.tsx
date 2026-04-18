import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import HomePage from '@/pages/HomePage';
import GenealogyPage from '@/pages/GenealogyPage';
import AdminPage from '@/pages/AdminPage';
import IntroductionPage from '@/pages/IntroductionPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/genealogy/:id" element={<GenealogyPage />} />
        <Route path="/introduction/:id" element={<IntroductionPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Toaster />
    </HashRouter>
  );
}

export default App;
