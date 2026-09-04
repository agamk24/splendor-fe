import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Room from './pages/Room';
import { useGameStore } from './store/gameStore';

function App() {
  const initSocketListeners = useGameStore((state) => state.initSocketListeners);

  useEffect(() => {
    // Inisialisasi socket listeners saat aplikasi pertama kali dimuat
    initSocketListeners();
  }, [initSocketListeners]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman Beranda / Landing untuk Create & Join Room */}
        <Route path="/" element={<Landing />} />

        {/* Halaman Room Game & Lobby */}
        <Route path="/room/:roomId" element={<Room />} />

        {/* Fallback untuk rute tak dikenal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
