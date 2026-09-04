// Sound Manager untuk Efek Suara Splendor
// Menggunakan Web Audio API (Synthesized Audio) sehingga langsung bersuara tanpa perlu download file mp3,
// sekaligus mendukung pemutaran file audio custom dari /public/sounds/ jika tersedia.

class SoundManager {
  constructor() {
    this.muted = localStorage.getItem('splendor_sound_muted') === 'true';
    this.ctx = null;
  }

  // Inisialisasi AudioContext saat pertama kali pengguna berinteraksi (aturan browser)
  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('splendor_sound_muted', String(this.muted));
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // Helper untuk membuat nada sintetis halus menggunakan Web Audio API
  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1, pitchDecay = true) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (pitchDecay) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('[SoundManager] Audio play error:', e);
    }
  }

  // 1. Suara denting permata / klik token (Clink)
  playTokenSelect() {
    if (this.muted) return;
    this.playTone(880, 'triangle', 0.1, 0.15, false); // A5 high bell
  }

  // 2. Suara konfirmasi ambil token (Coin bag clatter)
  playTakeTokens() {
    if (this.muted) return;
    this.playTone(523.25, 'sine', 0.12, 0.12, false);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.14, 0.14, false), 70);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.2, 0.16, false), 140);
  }

  // 3. Suara beli kartu perkembangan (Success chord)
  playBuyCard() {
    if (this.muted) return;
    this.playTone(440, 'sine', 0.2, 0.15, false);
    setTimeout(() => this.playTone(554.37, 'sine', 0.2, 0.15, false), 80);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.35, 0.2, false), 160);
  }

  // 4. Suara reservasi kartu (Mysterious shimmer)
  playReserveCard() {
    if (this.muted) return;
    this.playTone(587.33, 'triangle', 0.15, 0.12, false);
    setTimeout(() => this.playTone(880, 'sine', 0.3, 0.18, true), 90);
  }

  // 5. Suara kunjungan bangsawan / Noble tile visit (Majestic fanfare)
  playNobleVisit() {
    if (this.muted) return;
    this.playTone(523.25, 'triangle', 0.25, 0.2, false); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.25, 0.2, false), 120); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.25, 0.25, false), 240); // G5
    setTimeout(() => this.playTone(1046.5, 'triangle', 0.6, 0.3, false), 360); // C6
  }

  // 6. Suara peringatan error (Dull buzz)
  playError() {
    if (this.muted) return;
    this.playTone(180, 'sawtooth', 0.25, 0.15, true);
  }

  // 7. Suara kemenangan game selesai (Victory arpeggio)
  playVictory() {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.4, 0.25, false), idx * 110);
    });
  }

  // Opsi memutar file audio kustom (mp3/wav) jika user menaruh file di /public/sounds/
  playCustomSound(filename) {
    if (this.muted || typeof window === 'undefined') return;
    try {
      const audio = new Audio(`/sounds/${filename}`);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      // Fallback diam
    }
  }
}

export const sound = new SoundManager();
