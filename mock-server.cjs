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

// Generator kartu dummy Splendor
const generateMockCards = () => {
  const gems = ['white', 'blue', 'green', 'red', 'black'];
  let idCounter = 1;

  const createCard = (tier, points, gem, cost) => ({
    id: `card-${idCounter++}`,
    tier,
    points,
    gem,
    cost,
  });

  return {
    3: [createCard(3, 4, 'blue', { white: 7 }), createCard(3, 5, 'green', { green: 7, blue: 3 }), createCard(3, 3, 'red', { blue: 3, green: 3, red: 5, black: 3 }), createCard(3, 4, 'white', { black: 7 })],
    2: [createCard(2, 2, 'blue', { blue: 4, green: 2, black: 1 }), createCard(2, 3, 'red', { red: 6 }), createCard(2, 1, 'green', { white: 2, blue: 3, black: 2 }), createCard(2, 2, 'white', { red: 4, white: 2, green: 1 })],
    1: [createCard(1, 0, 'white', { blue: 1, green: 2, red: 1, black: 1 }), createCard(1, 0, 'blue', { white: 1, green: 1, red: 1, black: 1 }), createCard(1, 0, 'green', { white: 2, blue: 1 }), createCard(1, 1, 'black', { blue: 4 })],
  };
};

const generateMockNobles = () => [
  { id: 'noble-1', points: 3, requirements: { blue: 4, green: 4 } },
  { id: 'noble-2', points: 3, requirements: { red: 4, green: 4 } },
  { id: 'noble-3', points: 3, requirements: { white: 3, blue: 3, black: 3 } },
];

io.on('connection', (socket) => {
  console.log(`[MockServer] Client connected: ${socket.id}`);

  // 1. create_room { name }
  socket.on('create_room', ({ name }) => {
    const roomId = `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPlayer = {
      id: socket.id,
      socketId: socket.id,
      name: name || 'Host',
      isHost: true,
      connected: true,
      points: 0,
      tokens: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 },
      cards: [],
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

    console.log(`[MockServer] Room created: ${roomId} by ${newPlayer.name}`);
    socket.emit('room_created', { roomId });
    socket.emit('room_joined', { roomId, players: rooms[roomId].players });
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

    const newPlayer = {
      id: socket.id,
      socketId: socket.id,
      name: name || `Player ${room.players.length + 1}`,
      isHost: false,
      connected: true,
      points: 0,
      tokens: { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 },
      cards: [],
      reservedCards: [],
    };

    room.players.push(newPlayer);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = newPlayer.name;

    console.log(`[MockServer] ${newPlayer.name} joined ${roomId}`);
    socket.emit('room_joined', { roomId, players: room.players });
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
      existingPlayer.id = socket.id;
      existingPlayer.socketId = socket.id;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = name;

    console.log(`[MockServer] ${name} rejoined ${roomId}`);
    socket.emit('room_joined', { roomId, players: room.players });
    io.to(roomId).emit('player_list_update', { players: room.players });

    if (room.gameState) {
      socket.emit('state_update', { gameState: room.gameState });
    }
  });

  // 4. start_game { roomId }
  socket.on('start_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.players.length < 2) {
      return socket.emit('action_error', { message: 'Membutuhkan minimal 2 pemain untuk memulai.' });
    }

    const tokenBase = room.players.length === 2 ? 4 : room.players.length === 3 ? 5 : 7;

    const initialGameState = {
      roomId,
      status: 'playing',
      currentPlayerIndex: 0,
      bank: {
        white: tokenBase,
        blue: tokenBase,
        green: tokenBase,
        red: tokenBase,
        black: tokenBase,
        gold: 5,
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
    const currPlayer = gs.players[gs.currentPlayerIndex];

    console.log(`[MockServer] Action '${action.type}' from ${socket.playerName} in ${roomId}`);

    if (action.type === 'take_tokens') {
      const tokens = action.tokens || {};
      Object.entries(tokens).forEach(([color, count]) => {
        if (count > 0) {
          gs.bank[color] = Math.max(0, (gs.bank[color] || 0) - count);
          currPlayer.tokens[color] = (currPlayer.tokens[color] || 0) + count;
        }
      });
    } else if (action.type === 'buy_card') {
      const card = action.card;
      if (card) {
        // Kurangi token pemain sesuai cost
        if (card.cost) {
          Object.entries(card.cost).forEach(([c, amt]) => {
            currPlayer.tokens[c] = Math.max(0, (currPlayer.tokens[c] || 0) - amt);
            gs.bank[c] = (gs.bank[c] || 0) + amt;
          });
        }
        currPlayer.cards.push(card);
        currPlayer.points += card.points || 0;

        // Hapus dari table cards
        const tierCards = gs.tableCards[card.tier] || [];
        const cIdx = tierCards.findIndex((c) => c.id === card.id);
        if (cIdx !== -1) {
          tierCards.splice(cIdx, 1);
        }
      }
    } else if (action.type === 'reserve_card') {
      const card = action.card;
      if (card && currPlayer.reservedCards.length < 3) {
        currPlayer.reservedCards.push(card);
        if (gs.bank.gold > 0) {
          gs.bank.gold--;
          currPlayer.tokens.gold = (currPlayer.tokens.gold || 0) + 1;
        }
        const tierCards = gs.tableCards[card.tier] || [];
        const cIdx = tierCards.findIndex((c) => c.id === card.id);
        if (cIdx !== -1) {
          tierCards.splice(cIdx, 1);
        }
      }
    } else if (action.type === 'discard_tokens') {
      const tokens = action.tokens || {};
      Object.entries(tokens).forEach(([color, count]) => {
        if (count > 0) {
          currPlayer.tokens[color] = Math.max(0, (currPlayer.tokens[color] || 0) - count);
          gs.bank[color] = (gs.bank[color] || 0) + count;
        }
      });
    }

    // Cek jika poin pemain mencapai 15 (kondisi akhir permainan Splendor)
    if (currPlayer.points >= 15) {
      gs.status = 'finished';
      room.status = 'finished';
      console.log(`[MockServer] Game finished in ${roomId}. Winner: ${currPlayer.name}`);
    } else {
      // Pindah giliran ke pemain berikutnya
      gs.currentPlayerIndex = (gs.currentPlayerIndex + 1) % gs.players.length;
    }

    io.to(roomId).emit('state_update', { gameState: gs });
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
        io.to(socket.roomId).emit('state_update', { gameState: room.gameState });
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
