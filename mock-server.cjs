const http = require('http');
const { Server } = require('socket.io');

const PORT = 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'Mock Splendor Server Running', port: PORT }));
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Database in-memory sederhana untuk mock backend
const rooms = {};

// Helper konversi warna token
const normalizeColor = (c) => {
  const map = {
    white: 'white',
    diamond: 'white',
    blue: 'blue',
    sapphire: 'blue',
    green: 'green',
    emerald: 'green',
    red: 'red',
    ruby: 'red',
    black: 'black',
    onyx: 'black',
    gold: 'gold',
    yellow: 'gold',
  };
  return map[c] || c;
};

// Generator kartu dummy Splendor
const gems = ['white', 'blue', 'green', 'red', 'black'];
let idCounter = 1;

const createCard = (tier, points, gem, cost) => ({
  id: `card-${idCounter++}`,
  tier: tier || 1,
  points: typeof points === 'number' ? points : tier === 1 ? (Math.random() > 0.6 ? 1 : 0) : tier === 2 ? Math.floor(1 + Math.random() * 3) : Math.floor(3 + Math.random() * 3),
  gem: gem || gems[Math.floor(Math.random() * gems.length)],
  cost: cost || (tier === 1 ? { [gems[0]]: 1, [gems[1]]: 2 } : tier === 2 ? { [gems[2]]: 3, [gems[3]]: 2 } : { [gems[4]]: 7 }),
});

const generateMockCards = () => ({
  3: [createCard(3, 4, 'blue', { white: 7 }), createCard(3, 5, 'green', { green: 7, blue: 3 }), createCard(3, 3, 'red', { blue: 3, green: 3, red: 5, black: 3 }), createCard(3, 4, 'white', { black: 7 })],
  2: [createCard(2, 2, 'blue', { blue: 4, green: 2, black: 1 }), createCard(2, 3, 'red', { red: 6 }), createCard(2, 1, 'green', { white: 2, blue: 3, black: 2 }), createCard(2, 2, 'white', { red: 4, white: 2, green: 1 })],
  1: [createCard(1, 0, 'white', { blue: 1, green: 2, red: 1, black: 1 }), createCard(1, 0, 'blue', { white: 1, green: 1, red: 1, black: 1 }), createCard(1, 0, 'green', { white: 2, blue: 1 }), createCard(1, 1, 'black', { blue: 4 })],
});

const generateMockNobles = () => [
  { id: 'noble-1', points: 3, requirements: { blue: 4, green: 4 } },
  { id: 'noble-2', points: 3, requirements: { red: 4, green: 4 } },
  { id: 'noble-3', points: 3, requirements: { white: 3, blue: 3, black: 3 } },
];

let playerSeq = 1;

io.on('connection', (socket) => {
  console.log(`[MockServer] Client connected: ${socket.id}`);

  // 1. create_room { name }
  socket.on('create_room', ({ name }) => {
    const roomId = `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;
    const playerId = `player-${playerSeq++}`;
    const newPlayer = {
      id: playerId,
      playerId,
      socketId: socket.id,
      name: name || 'Host',
      isHost: true,
      connected: true,
      points: 0,
      tokens: {
        white: 100,
        blue: 100,
        green: 100,
        red: 100,
        black: 100,
        gold: 100,
        diamond: 100,
        sapphire: 100,
        emerald: 100,
        ruby: 100,
        onyx: 100,
      },
      cards: [],
      cardsOwned: [],
      reservedCards: [],
    };

    rooms[roomId] = {
      id: roomId,
      status: 'waiting',
      players: [newPlayer],
      gameState: null,
    };

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = newPlayer.name;

    console.log(`[MockServer] Room created: ${roomId} by ${newPlayer.name} (${playerId})`);
    socket.emit('room_created', { roomId, playerId });
    socket.emit('room_joined', { roomId, playerId, players: rooms[roomId].players });
  });

  // 2. join_room { roomId, name }
  socket.on('join_room', ({ roomId, name }) => {
    const room = rooms[roomId];
    if (!room) {
      return socket.emit('action_error', { message: `Room ${roomId} tidak ditemukan.` });
    }
    if (room.status !== 'waiting') {
      return socket.emit('action_error', { message: 'Game di room ini sudah dimulai.' });
    }
    if (room.players.length >= 4) {
      return socket.emit('action_error', { message: 'Room sudah penuh (maksimal 4 pemain).' });
    }

    const playerId = `player-${playerSeq++}`;
    const newPlayer = {
      id: playerId,
      playerId,
      socketId: socket.id,
      name: name || `Player ${room.players.length + 1}`,
      isHost: false,
      connected: true,
      points: 0,
      tokens: {
        white: 100,
        blue: 100,
        green: 100,
        red: 100,
        black: 100,
        gold: 100,
        diamond: 100,
        sapphire: 100,
        emerald: 100,
        ruby: 100,
        onyx: 100,
      },
      cards: [],
      cardsOwned: [],
      reservedCards: [],
    };

    room.players.push(newPlayer);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = newPlayer.name;

    console.log(`[MockServer] ${newPlayer.name} (${playerId}) joined ${roomId}`);
    socket.emit('room_joined', { roomId, playerId, players: room.players });
    io.to(roomId).emit('player_list_update', { players: room.players });
  });

  // 3. rejoin_room { roomId, name }
  socket.on('rejoin_room', ({ roomId, name }) => {
    const room = rooms[roomId];
    if (!room) {
      return socket.emit('action_error', { message: `Room ${roomId} tidak ditemukan saat rejoin.` });
    }

    const existingPlayer = room.players.find((p) => p.name === name);
    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.socketId = socket.id;
      // Jangan timpa existingPlayer.id agar ID stabil di seluruh siklus room
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = name;

    console.log(`[MockServer] ${name} rejoined ${roomId}`);
    socket.emit('room_joined', { roomId, playerId: existingPlayer?.id, players: room.players });
    io.to(roomId).emit('player_list_update', { players: room.players });

    if (room.gameState) {
      io.to(roomId).emit('state_update', { gameState: JSON.parse(JSON.stringify(room.gameState)) });
    }
  });

  // 4. start_game { roomId }
  socket.on('start_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.players.length < 1) {
      return socket.emit('action_error', { message: 'Membutuhkan minimal 1 pemain untuk memulai.' });
    }

    // Mode testing: Berikan 100 token untuk semua jenis token kepada setiap pemain
    room.players.forEach((p) => {
      p.tokens = {
        white: 100,
        blue: 100,
        green: 100,
        red: 100,
        black: 100,
        gold: 100,
        diamond: 100,
        sapphire: 100,
        emerald: 100,
        ruby: 100,
        onyx: 100,
      };
    });

    const initialGameState = {
      roomId,
      status: 'playing',
      currentPlayerIndex: 0,
      bank: {
        white: 100,
        blue: 100,
        green: 100,
        red: 100,
        black: 100,
        gold: 100,
        diamond: 100,
        sapphire: 100,
        emerald: 100,
        ruby: 100,
        onyx: 100,
      },
      nobles: generateMockNobles(),
      tableCards: generateMockCards(),
      decks: { 1: 36, 2: 26, 3: 16 },
      players: room.players,
    };

    room.status = 'playing';
    room.gameState = initialGameState;

    console.log(`[MockServer] Game started in ${roomId}`);
    io.to(roomId).emit('game_started', { gameState: initialGameState });
    io.to(roomId).emit('state_update', { gameState: initialGameState });
  });

  // 5. player_action { roomId, action }
  socket.on('player_action', ({ roomId, action }) => {
    const room = rooms[roomId];
    if (!room || !room.gameState) return;

    const gs = room.gameState;
    // Identifikasi pemain pelaku aksi: cari dari socket.id, socket.playerName, atau fallback turn index
    const actor = gs.players.find((p) => (p.socketId && p.socketId === socket.id) || (p.id && p.id === socket.id) || (socket.playerName && p.name === socket.playerName)) || gs.players[gs.currentPlayerIndex];

    const currPlayer = actor;
    const actorIdx = gs.players.indexOf(currPlayer);

    console.log(`[MockServer] Action '${action.type}' from ${socket.playerName || currPlayer.name} (${currPlayer.id}) in ${roomId}`);

    if (action.type === 'take_three_different') {
      const colors = action.colors || [];
      colors.forEach((c) => {
        const norm = normalizeColor(c);
        if ((gs.bank[norm] || 0) > 0) {
          gs.bank[norm]--;
          currPlayer.tokens[norm] = (currPlayer.tokens[norm] || 0) + 1;
        }
      });
    } else if (action.type === 'take_two_same') {
      const norm = normalizeColor(action.color);
      if ((gs.bank[norm] || 0) >= 2) {
        gs.bank[norm] -= 2;
        currPlayer.tokens[norm] = (currPlayer.tokens[norm] || 0) + 2;
      }
    } else if (action.type === 'take_tokens') {
      const tokens = action.tokens || {};
      Object.entries(tokens).forEach(([color, count]) => {
        const norm = normalizeColor(color);
        if (count > 0) {
          gs.bank[norm] = Math.max(0, (gs.bank[norm] || 0) - count);
          currPlayer.tokens[norm] = (currPlayer.tokens[norm] || 0) + count;
        }
      });
    } else if (action.type === 'buy_card') {
      const targetId = action.cardId || action.card?.id;
      let card = null;

      if (action.fromReserved) {
        const rIdx = currPlayer.reservedCards.findIndex((c) => c.id === targetId);
        if (rIdx !== -1) {
          [card] = currPlayer.reservedCards.splice(rIdx, 1);
        }
      } else {
        // Cari kartu di meja (across tier 1, 2, 3)
        for (const tier of [1, 2, 3]) {
          const tierCards = gs.tableCards[tier] || [];
          const cIdx = tierCards.findIndex((c) => c.id === targetId);
          if (cIdx !== -1) {
            card = tierCards[cIdx];
            // Ambil pengganti dari deck tier bersangkutan
            if (gs.decks && gs.decks[tier] > 0) {
              gs.decks[tier]--;
              const replacement = createCard(tier);
              tierCards.splice(cIdx, 1, replacement);
            } else {
              tierCards.splice(cIdx, 1);
            }
            break;
          }
        }
      }

      if (card) {
        // Potong tokens pemain
        if (card.cost) {
          Object.entries(card.cost).forEach(([c, amt]) => {
            const norm = normalizeColor(c);
            currPlayer.tokens[norm] = Math.max(0, (currPlayer.tokens[norm] || 0) - amt);
            gs.bank[norm] = (gs.bank[norm] || 0) + amt;
          });
        }
        currPlayer.cards.push(card);
        if (!currPlayer.cardsOwned) currPlayer.cardsOwned = [];
        currPlayer.cardsOwned.push(card);
        currPlayer.points += card.points || 0;
      }
    } else if (action.type === 'reserve_card') {
      let card = null;

      if (action.fromDeck) {
        const tier = action.tier || 1;
        if (gs.decks && gs.decks[tier] > 0) {
          gs.decks[tier]--;
        }
        card = createCard(tier);
      } else {
        const targetId = action.cardId || action.card?.id;
        for (const tier of [1, 2, 3]) {
          const tierCards = gs.tableCards[tier] || [];
          const cIdx = tierCards.findIndex((c) => c.id === targetId);
          if (cIdx !== -1) {
            card = tierCards[cIdx];
            if (gs.decks && gs.decks[tier] > 0) {
              gs.decks[tier]--;
              const replacement = createCard(tier);
              tierCards.splice(cIdx, 1, replacement);
            } else {
              tierCards.splice(cIdx, 1);
            }
            break;
          }
        }
      }

      if (card && currPlayer.reservedCards.length < 3) {
        currPlayer.reservedCards.push(card);
        if (gs.bank.gold > 0) {
          gs.bank.gold--;
          currPlayer.tokens.gold = (currPlayer.tokens.gold || 0) + 1;
        }
      }
    } else if (action.type === 'discard_tokens') {
      const tokens = action.tokens || {};
      Object.entries(tokens).forEach(([color, count]) => {
        const norm = normalizeColor(color);
        if (count > 0) {
          currPlayer.tokens[norm] = Math.max(0, (currPlayer.tokens[norm] || 0) - count);
          gs.bank[norm] = (gs.bank[norm] || 0) + count;
        }
      });
    }

    // Cek jika poin pemain mencapai 15 (kondisi akhir permainan Splendor)
    if (currPlayer.points >= 15) {
      gs.status = 'finished';
      room.status = 'finished';
      console.log(`[MockServer] Game finished in ${roomId}. Winner: ${currPlayer.name}`);
    } else {
      // Pindah giliran ke pemain berikutnya setelah pelaku aksi
      const nextIdx = actorIdx !== -1 ? (actorIdx + 1) % gs.players.length : (gs.currentPlayerIndex + 1) % gs.players.length;
      gs.currentPlayerIndex = nextIdx;
    }

    io.to(roomId).emit('state_update', { gameState: JSON.parse(JSON.stringify(gs)) });
  });

  socket.on('disconnect', () => {
    console.log(`[MockServer] Client disconnected: ${socket.id}`);
    if (socket.roomId && rooms[socket.roomId]) {
      const room = rooms[socket.roomId];
      const p = room.players.find((player) => player.name === socket.playerName);
      if (p) {
        p.connected = false;
      }
      io.to(socket.roomId).emit('player_list_update', { players: room.players });
      if (room.gameState) {
        io.to(socket.roomId).emit('state_update', { gameState: JSON.parse(JSON.stringify(room.gameState)) });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🎮 Splendor Mock Socket.IO Server Ready!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
