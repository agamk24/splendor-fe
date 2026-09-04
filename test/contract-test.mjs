// Integration test: FE payload builders vs real backend.
// Imports the ACTUAL frontend util modules so we test shipped code, not a copy.
// Usage: node contract-test.mjs [serverUrl]
import { io } from 'socket.io-client';
import { toServerColor, toServerTokenMap, normalizeColor } from '../src/utils/gemUtils.js';
import { translateError } from '../src/utils/errorMessages.js';

const URL = process.argv[2] || 'http://localhost:3000';
const log = (...a) => console.log(...a);
const fails = [];
const check = (label, ok, extra = '') => {
  log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra && !ok ? ' :: ' + extra : ''}`);
  if (!ok) fails.push(label);
};
const short = (v) => JSON.stringify(v?.error ?? v ?? '').slice(0, 120);

const connect = () => new Promise((res, rej) => {
  const s = io(URL, { transports: ['websocket'], reconnection: false });
  const t = setTimeout(() => rej(new Error('connect timeout')), 8000);
  s.on('connect', () => { clearTimeout(t); res(s); });
  s.on('connect_error', (e) => { clearTimeout(t); rej(e); });
});
const once = (s, ev, ms = 8000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error(`timeout waiting ${ev}`)), ms);
  s.once(ev, (p) => { clearTimeout(t); res(p); });
});

const run = async () => {
  log(`--- target: ${URL} ---`);

  // --- unit: color mapping + error table ---------------------------------
  check('toServerColor white->diamond', toServerColor('white') === 'diamond');
  check('toServerColor black->onyx', toServerColor('black') === 'onyx');
  check('toServerColor gold->gold', toServerColor('gold') === 'gold');
  check('toServerTokenMap drops zeros',
    JSON.stringify(toServerTokenMap({ white: 2, blue: 0, red: 1 })) === '{"diamond":2,"ruby":1}');
  check('normalizeColor round-trips', normalizeColor(toServerColor('green')) === 'green');
  check('translateError known code', translateError('NOT_YOUR_TURN') === 'Bukan giliran Anda.');
  check('translateError unknown passthrough', translateError('WAT') === 'WAT');

  // --- lobby --------------------------------------------------------------
  const host = await connect();
  host.emit('create_room', { name: 'Host' });
  const created = await once(host, 'room_created');
  check('room_created carries playerId', typeof created.playerId === 'string' && created.playerId.length > 0);
  const roomId = created.roomId;

  const guest = await connect();
  guest.emit('join_room', { roomId, name: 'Guest' });
  const joined = await once(guest, 'room_joined');
  check('room_joined carries playerId', typeof joined.playerId === 'string');
  check('player_list entries use playerId+isHost', joined.players.every((p) => 'playerId' in p && 'isHost' in p));

  guest.emit('start_game', { roomId });
  const notHost = await once(guest, 'action_error');
  check('non-host start rejected NOT_HOST', notHost.error === 'NOT_HOST', short(notHost));
  check('NOT_HOST translated', translateError(notHost.error) === 'Hanya host yang dapat memulai game.');

  // --- single source of truth for state -----------------------------------
  let gs = null;
  let lastError = null;
  const track = (s) => {
    s.on('state_update', (p) => { gs = p.gameState; });
    s.on('action_error', (p) => { lastError = p.error; });
  };
  track(host); track(guest);

  host.emit('start_game', { roomId });
  const started = await once(host, 'game_started');
  gs = started.gameState;

  check('gameState has tier keys', Boolean(gs.tableCards.tier1 && gs.tableCards.tier3));
  check('nobles use `requirement` singular', gs.nobles.every((n) => n.requirement && !n.requirements));
  check('players use cardsOwned', gs.players.every((p) => Array.isArray(p.cardsOwned)));
  check('players expose reservedCards', gs.players.every((p) => Array.isArray(p.reservedCards)));
  check('pendingDiscard field present', 'pendingDiscard' in gs);
  check('winnerId field present', 'winnerId' in gs);

  const sockOf = (pid) => (pid === created.playerId ? host : guest);
  // Always act as whoever the server says is current.
  const act = async (action, ms = 2500) => {
    const before = JSON.stringify(gs);
    lastError = null;
    const s = sockOf(gs.players[gs.currentPlayerIndex].id);
    s.emit('player_action', { roomId, action });
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 40));
      if (lastError) return { kind: 'error', error: lastError };
      if (JSON.stringify(gs) !== before) return { kind: 'state' };
    }
    return { kind: 'none' };
  };
  const bankUi = () => Object.fromEntries(Object.entries(gs.bank).map(([k, v]) => [normalizeColor(k), v]));

  // --- take_three_different (FE builder output) ---------------------------
  let three = Object.keys(bankUi()).filter((c) => c !== 'gold' && bankUi()[c] > 0).slice(0, 3);
  let r = await act({ type: 'take_three_different', colors: three.map(toServerColor) });
  check('take_three_different accepted', r.kind === 'state', short(r));

  // 2 colors must be rejected — proves BoardBank's "exactly 3" gate is required
  three = Object.keys(bankUi()).filter((c) => c !== 'gold' && bankUi()[c] > 0).slice(0, 2);
  r = await act({ type: 'take_three_different', colors: three.map(toServerColor) });
  check('2 colors rejected NEED_THREE_DISTINCT_COLORS',
    r.kind === 'error' && r.error === 'NEED_THREE_DISTINCT_COLORS', short(r));

  // old FE action name must be rejected — proves the rename was necessary
  r = await act({ type: 'take_tokens', tokens: { white: 1 } });
  check('legacy take_tokens rejected UNKNOWN_ACTION',
    r.kind === 'error' && r.error === 'UNKNOWN_ACTION', short(r));

  // --- take_two_same ------------------------------------------------------
  const two = Object.keys(bankUi()).find((c) => c !== 'gold' && bankUi()[c] >= 4);
  if (two) {
    r = await act({ type: 'take_two_same', color: toServerColor(two) });
    check('take_two_same accepted', r.kind === 'state', short(r));
  } else {
    check('take_two_same accepted', false, 'no colour with >=4 in bank');
  }

  // --- reserve ------------------------------------------------------------
  r = await act({ type: 'reserve_card', fromDeck: true, tier: 1 });
  check('reserve_card fromDeck accepted', r.kind === 'state', short(r));

  const tableCard = gs.tableCards.tier1[0];
  r = await act({ type: 'reserve_card', cardId: tableCard.id });
  check('reserve_card from table accepted', r.kind === 'state', short(r));

  // --- buy_card -----------------------------------------------------------
  const buyTarget = gs.tableCards.tier1[0];
  r = await act({ type: 'buy_card', cardId: buyTarget.id, fromReserved: false });
  check('buy_card fromReserved:false understood',
    r.kind === 'state' || (r.kind === 'error' && r.error === 'INSUFFICIENT_RESOURCES'), short(r));

  // buying a reserved card as if it were on the table must fail -> proves the flag matters
  const holder = gs.players.find((p) => p.reservedCards.length > 0);
  if (holder) {
    const rid = holder.reservedCards[0].id;
    r = await act({ type: 'buy_card', cardId: rid, fromReserved: false });
    check('reserved card w/o fromReserved rejected CARD_NOT_ON_TABLE',
      r.kind === 'error' && r.error === 'CARD_NOT_ON_TABLE', short(r));
  }

  // --- discard payload key ------------------------------------------------
  r = await act({ type: 'discard_tokens', tokensToDiscard: toServerTokenMap({ white: 1 }) });
  check('discard w/o pending -> NO_DISCARD_PENDING',
    r.kind === 'error' && r.error === 'NO_DISCARD_PENDING', short(r));

  // --- rejoin keeps identity ---------------------------------------------
  guest.close();
  await new Promise((res) => setTimeout(res, 400));
  const guest2 = await connect();
  guest2.emit('rejoin_room', { roomId, name: 'Guest' });
  const rejoined = await once(guest2, 'room_joined');
  check('rejoin returns same playerId', rejoined.playerId === joined.playerId);
  const resumed = await once(guest2, 'state_update');
  check('rejoin replays state_update', Boolean(resumed.gameState));

  host.close(); guest2.close();
  log(`\n${fails.length === 0 ? 'ALL PASS' : 'FAILURES (' + fails.length + '): ' + fails.join(' | ')}`);
  process.exit(fails.length === 0 ? 0 : 1);
};

run().catch((e) => { console.error('ERROR', e.message); process.exit(1); });
