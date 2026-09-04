import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { on, getServerUrl } from '../socket/socketClient';

export default function Landing() {
  const navigate = useNavigate();

  // Zustand state & actions
  const storedName = useGameStore((state) => state.myName);
  const setMyName = useGameStore((state) => state.setMyName);
  const setRoomId = useGameStore((state) => state.setRoomId);
  const createRoom = useGameStore((state) => state.createRoom);
  const joinRoom = useGameStore((state) => state.joinRoom);
  const isConnected = useGameStore((state) => state.isConnected);
  const lastError = useGameStore((state) => state.lastError);
  const clearError = useGameStore((state) => state.clearError);

  // Local state
  const [name, setName] = useState(storedName || sessionStorage.getItem('myName') || '');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'

  // Sync state myName jika storedName berubah
  useEffect(() => {
    if (storedName && !name) {
      setName(storedName);
    }
  }, [storedName]);

  // Handle socket response events untuk navigasi & error
  useEffect(() => {
    // 1. Saat room_created diterima dari server
    const unsubCreated = on('room_created', (data) => {
      setIsSubmitting(false);
      const newRoomId = typeof data === 'string' ? data : data?.roomId;
      if (newRoomId) {
        const currentName = name.trim() || sessionStorage.getItem('myName') || 'Pemain';
        sessionStorage.setItem('myName', currentName);
        sessionStorage.setItem('roomId', newRoomId);
        setMyName(currentName);
        setRoomId(newRoomId);
        navigate(`/room/${newRoomId}`);
      }
    });

    // 2. Saat room_joined diterima dari server
    const unsubJoined = on('room_joined', (data) => {
      setIsSubmitting(false);
      const joinedRoomId = data?.roomId || inputRoomCode.trim();
      if (joinedRoomId) {
        const currentName = name.trim() || sessionStorage.getItem('myName') || 'Pemain';
        sessionStorage.setItem('myName', currentName);
        sessionStorage.setItem('roomId', joinedRoomId);
        setMyName(currentName);
        setRoomId(joinedRoomId);
        navigate(`/room/${joinedRoomId}`);
      }
    });

    // 3. Reset loading saat terjadi action_error
    const unsubError = on('action_error', () => {
      setIsSubmitting(false);
    });

    return () => {
      unsubCreated();
      unsubJoined();
      unsubError();
    };
  }, [navigate, name, inputRoomCode, setMyName, setRoomId]);

  // Handle pembuatan room
  const handleCreateRoom = (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError('Harap masukkan nama tampilan terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    sessionStorage.setItem('myName', trimmedName);
    setMyName(trimmedName);
    createRoom(trimmedName);
  };

  // Handle gabung room
  const handleJoinRoom = (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    const trimmedName = name.trim();
    const trimmedCode = inputRoomCode.trim();

    if (!trimmedName) {
      setLocalError('Harap masukkan nama tampilan terlebih dahulu.');
      return;
    }
    if (!trimmedCode) {
      setLocalError('Harap masukkan kode room yang ingin dimasuki.');
      return;
    }

    setIsSubmitting(true);
    sessionStorage.setItem('myName', trimmedName);
    setMyName(trimmedName);
    joinRoom(trimmedCode, trimmedName);
  };

  const currentErrorMessage = localError || lastError;

  return (
    <div className="container" style={{ maxWidth: '540px', paddingTop: '3rem', paddingBottom: '3rem' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.25rem' }}>💎</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' }}>SPLENDOR</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.25rem' }}>Web Multiplayer Card &amp; Token Game</p>

        <div style={{ marginTop: '0.75rem' }}>
          <span className={`badge ${isConnected ? 'badge-connected' : 'badge-disconnected'}`}>
            <span className="badge-dot" />
            {isConnected ? 'Server Online' : 'Menghubungkan ke Server...'}
          </span>
        </div>
      </header>

      {/* Main Card */}
      <div className="card" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        {/* Error Alert */}
        {currentErrorMessage && (
          <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
            <span>⚠️ {currentErrorMessage}</span>
            <button
              onClick={() => {
                setLocalError('');
                clearError();
              }}
              style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
              title="Tutup pesan error"
            >
              &times;
            </button>
          </div>
        )}

        {/* Input Nama Pemain (Shared) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1' }}>
            Nama Anda <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Contoh: Merchant123"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (localError) setLocalError('');
            }}
            maxLength={20}
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* Tab Toggle: Create vs Join */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setLocalError('');
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'create' ? '#3b82f6' : 'transparent',
              color: activeTab === 'create' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Buat Room
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('join');
              setLocalError('');
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'join' ? '#3b82f6' : 'transparent',
              color: activeTab === 'join' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Gabung Room
          </button>
        </div>

        {/* Action Form */}
        {activeTab === 'create' ? (
          <form onSubmit={handleCreateRoom}>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem' }}>Buat room baru dan bagikan kode room kepada teman Anda untuk bermain bersama.</p>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={isSubmitting || !isConnected}>
              {isSubmitting ? 'Membuat Room...' : '🚀 Create Room'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinRoom}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1' }}>
                Kode Room <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Masukkan kode room (mis. ROOM123)"
                value={inputRoomCode}
                onChange={(e) => {
                  setInputRoomCode(e.target.value.toUpperCase());
                  if (localError) setLocalError('');
                }}
                disabled={isSubmitting}
              />
            </div>
            <button type="submit" className="btn btn-emerald" style={{ width: '100%', padding: '0.8rem' }} disabled={isSubmitting || !isConnected}>
              {isSubmitting ? 'Bergabung...' : '🚪 Join Room'}
            </button>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <footer style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
        Server: <code style={{ color: '#94a3b8' }}>{getServerUrl()}</code>
      </footer>
    </div>
  );
}
