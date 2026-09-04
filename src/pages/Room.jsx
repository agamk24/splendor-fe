import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import Lobby from '../components/Lobby';
import BoardBank from '../components/BoardBank';
import CardTable from '../components/CardTable';
import NobleRow from '../components/NobleRow';
import PlayerPanel from '../components/PlayerPanel';
import EndGameScreen from '../components/EndGameScreen';
import ToastAlert from '../components/ToastAlert';
import { ALL_GEMS, GEM_METADATA, normalizeColor } from '../utils/gemUtils';
import { sound } from '../utils/soundManager';

export default function Room() {
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();

  // Zustand Store
  const myName = useGameStore((state) => state.myName);
  const setMyName = useGameStore((state) => state.setMyName);
  const setRoomId = useGameStore((state) => state.setRoomId);
  const isConnected = useGameStore((state) => state.isConnected);
  const gameState = useGameStore((state) => state.gameState);
  const rejoinRoom = useGameStore((state) => state.rejoinRoom);
  const joinRoom = useGameStore((state) => state.joinRoom);
  const resetStore = useGameStore((state) => state.resetStore);
  const me = useGameStore((state) => state.getMe());
  const discardTokens = useGameStore((state) => state.discardTokens);

  // Local state
  const [inputName, setInputName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [discardSelection, setDiscardSelection] = useState({
    white: 0,
    blue: 0,
    green: 0,
    red: 0,
    black: 0,
    gold: 0,
  });

  // Saat mount: handle refresh / direct visit dengan sessionStorage
  useEffect(() => {
    const savedRoom = sessionStorage.getItem('roomId');
    const savedName = sessionStorage.getItem('myName');

    if (urlRoomId) {
      setRoomId(urlRoomId);
    }

    const effectiveName = myName || savedName;

    if (urlRoomId && effectiveName) {
      if (!myName) {
        setMyName(effectiveName);
      }
      sessionStorage.setItem('roomId', urlRoomId);
      sessionStorage.setItem('myName', effectiveName);

      // Emit rejoin_room saat mount/refresh sesuai spesifikasi brief
      console.log(`[Room] Emitting rejoin_room for ${effectiveName} in ${urlRoomId}`);
      rejoinRoom(urlRoomId, effectiveName);
    }
  }, [urlRoomId, myName, rejoinRoom, setMyName, setRoomId]);

  // Handle bergabung jika membuka URL room langsung tanpa nama
  const handleJoinDirect = (e) => {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) {
      setJoinError('Silakan masukkan nama Anda.');
      return;
    }
    setJoinError('');
    sessionStorage.setItem('myName', trimmed);
    sessionStorage.setItem('roomId', urlRoomId);
    setMyName(trimmed);
    setRoomId(urlRoomId);
    joinRoom(urlRoomId, trimmed);
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('roomId');
    resetStore();
    navigate('/');
  };

  const players = gameState?.players || [];

  // Token pemain lokal, dinormalkan dari nama resmi backend ke warna UI.
  const myTokens = {};
  Object.entries(me?.tokens || {}).forEach(([serverColor, count]) => {
    myTokens[normalizeColor(serverColor)] = count;
  });
  const myTotalTokens = ALL_GEMS.reduce((sum, c) => sum + (myTokens[c] || 0), 0);

  // Fase buang token ditentukan server lewat pendingDiscard, bukan ditebak klien.
  const pendingDiscard = gameState?.pendingDiscard || null;
  const needsDiscard = Boolean(pendingDiscard && me && pendingDiscard.playerId === me.id);
  const tokensToDiscard = needsDiscard ? pendingDiscard.excess : 0;
  const selectedDiscardCount = Object.values(discardSelection).reduce((a, b) => a + b, 0);

  const handleConfirmDiscard = () => {
    // Backend menuntut jumlah persis; kurang atau lebih ditolak DISCARD_WRONG_AMOUNT.
    if (selectedDiscardCount !== tokensToDiscard) return;
    discardTokens(discardSelection);
    setDiscardSelection({ white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 });
  };

  // Jika nama pemain belum ada (buka URL langsung), tampilkan form input nama
  if (!myName && !sessionStorage.getItem('myName')) {
    return (
      <div className="container" style={{ maxWidth: '480px', paddingTop: '4rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <span style={{ fontSize: '2.5rem' }}>💎</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>Bergabung ke Room</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Anda diundang ke room <strong style={{ color: '#38bdf8' }}>{urlRoomId}</strong>. Masukkan nama tampilan Anda untuk bergabung.
          </p>

          {joinError && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>
              <span>⚠️ {joinError}</span>
            </div>
          )}

          <form onSubmit={handleJoinDirect}>
            <input type="text" className="input-field" placeholder="Nama tampilan Anda" value={inputName} onChange={(e) => setInputName(e.target.value)} style={{ marginBottom: '1rem' }} autoFocus />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => navigate('/')} className="btn btn-secondary" style={{ flex: 1 }}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!isConnected}>
                Gabung
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const currentStatus = gameState?.status || 'waiting';

  return (
    <div className="container room-container" style={{ paddingTop: '1rem', paddingBottom: '2.5rem' }}>
      {/* Toast Alert Auto-Hide untuk Error Action */}
      <ToastAlert />

      {/* Top Bar Room Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>💎</span>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Splendor Online</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Room: <span style={{ color: '#38bdf8' }}>{urlRoomId}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => {
              sound.toggleMute();
              setIsMuted(sound.isMuted());
            }}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
            title={isMuted ? 'Suara Dinonaktifkan (Klik untuk aktifkan)' : 'Suara Aktif (Klik untuk matikan)'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <span className={`badge ${isConnected ? 'badge-connected' : 'badge-disconnected'}`}>
            <span className="badge-dot" />
            {isConnected ? 'Online' : 'Offline'}
          </span>
          <button onClick={handleLeaveRoom} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            Keluar
          </button>
        </div>
      </div>

      {/* Render Kondisional Sesuai gameState.status */}
      {currentStatus === 'waiting' && <Lobby roomId={urlRoomId} />}

      {currentStatus === 'playing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Modal Discard Token jika > 10 - Dipindahkan ke Layar Utama (document.body) */}
          {needsDiscard &&
            typeof document !== 'undefined' &&
            createPortal(
              <div className="modal-overlay">
                <div className="card modal-content" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '1.75rem', border: '1px solid #ef4444' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', marginBottom: '0.5rem' }}>⚠️ Batas Token Terlampaui</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Anda memiliki <strong>{myTotalTokens}</strong> token (maksimal 10). Silakan pilih <strong>{tokensToDiscard}</strong> token untuk dikembalikan ke bank.
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    {ALL_GEMS.map((color) => {
                      const meta = GEM_METADATA[color];
                      const owned = myTokens[color] || 0;
                      const discarded = discardSelection[color] || 0;
                      if (owned <= 0) return null;

                      return (
                        <div key={color} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <div
                            className="gem-token"
                            style={{
                              background: meta.bgColor,
                              border: `2px solid ${meta.borderColor}`,
                              color: meta.textColor,
                              width: '44px',
                              height: '44px',
                              fontSize: '0.85rem',
                            }}
                          >
                            <span>{meta.symbol}</span>
                            <span>{owned - discarded}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              type="button"
                              onClick={() =>
                                setDiscardSelection((prev) => ({
                                  ...prev,
                                  [color]: Math.max(0, (prev[color] || 0) - 1),
                                }))
                              }
                              disabled={discarded <= 0}
                              style={{ padding: '2px 6px', fontSize: '0.75rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '3px' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 4px' }}>{discarded}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setDiscardSelection((prev) => ({
                                  ...prev,
                                  [color]: Math.min(owned, (prev[color] || 0) + 1),
                                }))
                              }
                              disabled={discarded >= owned || selectedDiscardCount >= tokensToDiscard}
                              style={{ padding: '2px 6px', fontSize: '0.75rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '3px' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button type="button" className="btn btn-primary" style={{ width: '100%' }} disabled={selectedDiscardCount !== tokensToDiscard} onClick={handleConfirmDiscard}>
                    Kembalikan Token ({selectedDiscardCount}/{tokensToDiscard})
                  </button>
                </div>
              </div>,
              document.body,
            )}

          {/* Layout Permainan Utama: Card Player di sebelah kiri, Meja di sebelah kanan */}
          <div className="game-layout">
            {/* Kolom Kiri: Card Player (Panel Pemain) */}
            <aside className="game-players-column">
              <div className="players-list">
                {players.map((p, idx) => (
                  <PlayerPanel key={p.id || idx} player={p} index={idx} />
                ))}
              </div>
            </aside>

            {/* Kolom Kanan: Papan Permainan (Bangsawan, Kartu Meja, & Bank Permata) */}
            <main className="game-table-column">
              {/* Noble Row di bagian atas papan */}
              <NobleRow />

              {/* Area Meja Utama: Card Table & Token Bank */}
              <div className="game-board-grid">
                <CardTable />
                <BoardBank />
              </div>
            </main>
          </div>
        </div>
      )}

      {currentStatus === 'finished' && <EndGameScreen />}
    </div>
  );
}
