import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import HomePage from '@/pages/HomePage';
import GenealogyPage from '@/pages/GenealogyPage';
import AdminPage from '@/pages/AdminPage';
import IntroductionPage from '@/pages/IntroductionPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/genealogy/:id" element={<GenealogyPage />} />
        <Route path="/introduction/:id" element={<IntroductionPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
