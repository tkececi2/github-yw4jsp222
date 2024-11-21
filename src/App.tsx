import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Anasayfa } from './pages/Anasayfa';
import { Arizalar } from './pages/Arizalar';
import { ArizaDetay } from './pages/ArizaDetay';
import { Ekip } from './pages/Ekip';
import { Sahalar } from './pages/Sahalar';
import { Istatistikler } from './pages/Istatistikler';
import { Performans } from './pages/Performans';
import { Raporlar } from './pages/Raporlar';
import { Ayarlar } from './pages/Ayarlar';
import { Musteriler } from './pages/Musteriler';
import { NobetKontrol } from './pages/NobetKontrol';
import { PrivateRoute } from './components/PrivateRoute';
import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/anasayfa" element={<Anasayfa />} />
        <Route path="/arizalar" element={<Arizalar />} />
        <Route path="/arizalar/:id" element={<ArizaDetay />} />
        <Route path="/sahalar" element={<Sahalar />} />
        <Route path="/ekip" element={<Ekip />} />
        <Route path="/istatistikler" element={<Istatistikler />} />
        <Route path="/performans" element={<Performans />} />
        <Route path="/raporlar" element={<Raporlar />} />
        <Route path="/ayarlar" element={<Ayarlar />} />
        <Route path="/musteriler" element={<Musteriler />} />
        <Route path="/nobet-kontrol" element={<NobetKontrol />} />
      </Route>
      <Route path="/" element={<Navigate to="/anasayfa" replace />} />
      <Route path="*" element={<Navigate to="/anasayfa" replace />} />
    </Routes>
  );
}

export default App;