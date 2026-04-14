import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import HomePage from '@/pages/HomePage';
import GenealogyPage from '@/pages/GenealogyPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/genealogy/:id" element={<GenealogyPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
