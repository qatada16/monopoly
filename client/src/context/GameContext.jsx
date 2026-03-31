import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { db } from '../firebase.js';
import { ref, set, onValue, remove } from 'firebase/database';
import { playNotificationSound, vibrateDevice } from '../sounds.js';

const GameContext = createContext();
const GAME_REF = 'currentGame';
const NOTIF_REF = 'notifications';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(() => sessionStorage.getItem('monopoly_pid') || null);
  const shownNotifs = useRef(new Set());
  const initialLoad = useRef(true);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    playNotificationSound(type);
    vibrateDevice(type);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const broadcastNotification = useCallback(async (message, type = 'success') => {
    const notifRef = ref(db, NOTIF_REF);
    const id = generateId();
    const notif = { id, message, type, timestamp: Date.now() };
    const snap = await new Promise(resolve => onValue(ref(db, NOTIF_REF), resolve, { onlyOnce: true }));
    const existing = snap.val() || {};
    const now = Date.now();
    const cleaned = {};
    Object.entries(existing).forEach(([k, v]) => {
      if (now - v.timestamp < 10000) cleaned[k] = v;
    });
    cleaned[id] = notif;
    await set(notifRef, cleaned);
  }, []);

  // Listen to game state
  useEffect(() => {
    const gameRef = ref(db, GAME_REF);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.players) {
        data.players = Object.values(data.players).map(p => ({
          ...p,
          transactions: p.transactions ? Object.values(p.transactions) : []
        }));
      }
      if (data && data.loanRequests) {
        data.loanRequests = Object.values(data.loanRequests);
      } else if (data) {
        data.loanRequests = [];
      }
      setGameState(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to notifications
  useEffect(() => {
    const notifRef = ref(db, NOTIF_REF);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const notifs = Object.values(data);
      if (initialLoad.current) {
        notifs.forEach(n => shownNotifs.current.add(n.id));
        initialLoad.current = false;
        return;
      }
      notifs.forEach(n => {
        if (!shownNotifs.current.has(n.id)) {
          shownNotifs.current.add(n.id);
          addToast(n.message, n.type);
        }
      });
    });

    return () => unsubscribe();
  }, [addToast]);

  // Write game state to Firebase
  const persistGame = useCallback(async (state) => {
    const gameRef = ref(db, GAME_REF);
    if (state) {
      state.lastUpdated = new Date().toISOString();
      await set(gameRef, state);
    } else {
      await remove(gameRef);
    }
  }, []);

  // --- Auth ---
  const login = useCallback((key) => {
    if (!gameState || !gameState.players) {
      addToast('No active game', 'error');
      return false;
    }
    const player = gameState.players.find(p => p.key === key);
    if (!player) {
      addToast('Invalid key', 'error');
      return false;
    }
    setCurrentPlayerId(player.id);
    sessionStorage.setItem('monopoly_pid', player.id);
    return true;
  }, [gameState, addToast]);

  const logout = useCallback(() => {
    setCurrentPlayerId(null);
    sessionStorage.removeItem('monopoly_pid');
  }, []);

  // --- Game actions ---
  const createGame = useCallback(async ({ playerNames, playerKeys, initialAmount, maxLoanPerPlayer }) => {
    if (!Array.isArray(playerNames) || playerNames.length < 2) {
      addToast('At least 2 players required', 'error');
      return { success: false };
    }
    if (initialAmount <= 0 || maxLoanPerPlayer < 0) {
      addToast('Invalid amounts', 'error');
      return { success: false };
    }
    const uniqueNames = new Set(playerNames.map(n => n.trim().toLowerCase()));
    if (uniqueNames.size !== playerNames.length) {
      addToast('Player names must be unique', 'error');
      return { success: false };
    }
    const uniqueKeys = new Set(playerKeys.map(k => k.trim()));
    if (uniqueKeys.size !== playerKeys.length || playerKeys.some(k => !k.trim())) {
      addToast('All keys must be unique and non-empty', 'error');
      return { success: false };
    }

    const players = playerNames.map((name, i) => ({
      id: generateId(),
      name: name.trim(),
      key: playerKeys[i].trim(),
      balance: initialAmount,
      loanTaken: 0,
      maxLoan: maxLoanPerPlayer,
      transactions: []
    }));

    const state = {
      gameActive: true,
      players,
      loanRequests: [],
      bank: { totalDistributed: initialAmount * players.length, loansGiven: 0 },
      config: { initialAmount, maxLoanPerPlayer },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await persistGame(state);
    broadcastNotification('Game started!');
    return { success: true };
  }, [addToast, broadcastNotification, persistGame]);

  const transferMoney = useCallback(async (senderId, recipientId, amount) => {
    const prev = gameState;
    if (!prev || !prev.gameActive) { addToast('No active game', 'error'); return { success: false }; }
    amount = Number(amount);
    if (!amount || amount <= 0) { addToast('Invalid amount', 'error'); return { success: false }; }

    const state = JSON.parse(JSON.stringify(prev));
    const sender = state.players.find(p => p.id === senderId);
    const recipient = state.players.find(p => p.id === recipientId);

    if (!sender || !recipient) { addToast('Player not found', 'error'); return { success: false }; }
    if (sender.id === recipient.id) { addToast('Cannot transfer to yourself', 'error'); return { success: false }; }
    if (sender.balance < amount) { addToast('Insufficient balance', 'error'); return { success: false }; }

    sender.balance -= amount;
    recipient.balance += amount;
    const timestamp = new Date().toISOString();
    sender.transactions.push({ type: 'transfer_out', to: recipient.name, amount, timestamp });
    recipient.transactions.push({ type: 'transfer_in', from: sender.name, amount, timestamp });

    await persistGame(state);
    broadcastNotification(`${sender.name} paid $${amount} to ${recipient.name}`);
    return { success: true };
  }, [gameState, addToast, broadcastNotification, persistGame]);

  const takeLoan = useCallback(async (playerId, amount) => {
    const prev = gameState;
    if (!prev || !prev.gameActive) { addToast('No active game', 'error'); return { success: false }; }
    amount = Number(amount);
    if (!amount || amount <= 0) { addToast('Invalid amount', 'error'); return { success: false }; }

    const state = JSON.parse(JSON.stringify(prev));
    const player = state.players.find(p => p.id === playerId);
    if (!player) { addToast('Player not found', 'error'); return { success: false }; }

    const remaining = player.maxLoan - player.loanTaken;
    if (amount > remaining) { addToast(`Exceeds loan limit. Remaining: $${remaining}`, 'error'); return { success: false }; }

    player.balance += amount;
    player.loanTaken += amount;
    state.bank.loansGiven += amount;
    player.transactions.push({ type: 'loan_taken', amount, timestamp: new Date().toISOString() });

    await persistGame(state);
    broadcastNotification(`${player.name} took a $${amount} loan`);
    return { success: true };
  }, [gameState, addToast, broadcastNotification, persistGame]);

  const repayLoan = useCallback(async (playerId, amount) => {
    const prev = gameState;
    if (!prev || !prev.gameActive) { addToast('No active game', 'error'); return { success: false }; }
    amount = Number(amount);
    if (!amount || amount <= 0) { addToast('Invalid amount', 'error'); return { success: false }; }

    const state = JSON.parse(JSON.stringify(prev));
    const player = state.players.find(p => p.id === playerId);
    if (!player) { addToast('Player not found', 'error'); return { success: false }; }
    if (player.loanTaken <= 0) { addToast('No outstanding loan', 'error'); return { success: false }; }
    if (amount > player.loanTaken) { addToast('Amount exceeds outstanding loan', 'error'); return { success: false }; }
    if (amount > player.balance) { addToast('Insufficient balance', 'error'); return { success: false }; }

    player.balance -= amount;
    player.loanTaken -= amount;
    state.bank.loansGiven -= amount;
    player.transactions.push({ type: 'loan_repaid', amount, timestamp: new Date().toISOString() });

    await persistGame(state);
    broadcastNotification(`${player.name} repaid $${amount}`);
    return { success: true };
  }, [gameState, addToast, broadcastNotification, persistGame]);

  const endGame = useCallback(async () => {
    if (!gameState) return { success: false };
    const state = JSON.parse(JSON.stringify(gameState));
    state.gameActive = false;
    await persistGame(state);
    broadcastNotification('Game ended!', 'info');
    return { success: true };
  }, [gameState, broadcastNotification, persistGame]);

  const restartGame = useCallback(async () => {
    await persistGame(null);
    setCurrentPlayerId(null);
    sessionStorage.removeItem('monopoly_pid');
    broadcastNotification('Game cleared! Start a new one.', 'info');
    return { success: true };
  }, [broadcastNotification, persistGame]);

  const payBank = useCallback(async (playerId, amount) => {
    const prev = gameState;
    if (!prev || !prev.gameActive) { addToast('No active game', 'error'); return { success: false }; }
    amount = Number(amount);
    if (!amount || amount <= 0) { addToast('Invalid amount', 'error'); return { success: false }; }

    const state = JSON.parse(JSON.stringify(prev));
    const player = state.players.find(p => p.id === playerId);
    if (!player) { addToast('Player not found', 'error'); return { success: false }; }
    if (player.balance < amount) { addToast('Insufficient balance', 'error'); return { success: false }; }

    player.balance -= amount;
    player.transactions.push({ type: 'paid_bank', amount, timestamp: new Date().toISOString() });

    await persistGame(state);
    broadcastNotification(`${player.name} paid $${amount} to the Bank`);
    return { success: true };
  }, [gameState, addToast, broadcastNotification, persistGame]);

  const bankPayPlayer = useCallback(async (playerId, amount) => {
    const prev = gameState;
    if (!prev || !prev.gameActive) { addToast('No active game', 'error'); return { success: false }; }
    amount = Number(amount);
    if (!amount || amount <= 0) { addToast('Invalid amount', 'error'); return { success: false }; }

    const state = JSON.parse(JSON.stringify(prev));
    const player = state.players.find(p => p.id === playerId);
    if (!player) { addToast('Player not found', 'error'); return { success: false }; }

    player.balance += amount;
    state.bank.totalDistributed += amount;
    player.transactions.push({ type: 'received_from_bank', amount, timestamp: new Date().toISOString() });

    await persistGame(state);
    broadcastNotification(`Bank paid $${amount} to ${player.name}`);
    return { success: true };
  }, [gameState, addToast, broadcastNotification, persistGame]);

  // --- Loan Requests ---
  const requestLoan = useCallback(async (playerId, amount) => {
    const prev = gameState;
    if (!prev || !prev.gameActive) { addToast('No active game', 'error'); return { success: false }; }
    amount = Number(amount);
    if (!amount || amount <= 0) { addToast('Invalid amount', 'error'); return { success: false }; }

    const state = JSON.parse(JSON.stringify(prev));
    const player = state.players.find(p => p.id === playerId);
    if (!player) { addToast('Player not found', 'error'); return { success: false }; }

    const remaining = player.maxLoan - player.loanTaken;
    if (amount > remaining) { addToast(`Exceeds loan limit. Remaining: $${remaining}`, 'error'); return { success: false }; }

    const requests = state.loanRequests || [];
    if (requests.some(r => r.playerId === playerId)) {
      addToast('You already have a pending loan request', 'error');
      return { success: false };
    }

    requests.push({
      id: generateId(),
      playerId,
      playerName: player.name,
      amount,
      timestamp: new Date().toISOString()
    });
    state.loanRequests = requests;

    await persistGame(state);
    broadcastNotification(`${player.name} requested a $${amount} loan`, 'info');
    return { success: true };
  }, [gameState, addToast, broadcastNotification, persistGame]);

  const approveLoanRequest = useCallback(async (requestId) => {
    const prev = gameState;
    if (!prev || !prev.gameActive) return { success: false };

    const state = JSON.parse(JSON.stringify(prev));
    const requests = state.loanRequests || [];
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) { addToast('Request not found', 'error'); return { success: false }; }

    const req = requests[reqIndex];
    const player = state.players.find(p => p.id === req.playerId);
    if (!player) { addToast('Player not found', 'error'); return { success: false }; }

    const remaining = player.maxLoan - player.loanTaken;
    if (req.amount > remaining) { addToast(`Exceeds loan limit. Remaining: $${remaining}`, 'error'); return { success: false }; }

    player.balance += req.amount;
    player.loanTaken += req.amount;
    state.bank.loansGiven += req.amount;
    player.transactions.push({ type: 'loan_taken', amount: req.amount, timestamp: new Date().toISOString() });

    requests.splice(reqIndex, 1);
    state.loanRequests = requests;

    await persistGame(state);
    broadcastNotification(`${player.name}'s $${req.amount} loan approved!`);
    return { success: true };
  }, [gameState, addToast, broadcastNotification, persistGame]);

  const rejectLoanRequest = useCallback(async (requestId) => {
    const prev = gameState;
    if (!prev || !prev.gameActive) return { success: false };

    const state = JSON.parse(JSON.stringify(prev));
    const requests = state.loanRequests || [];
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) { addToast('Request not found', 'error'); return { success: false }; }

    const req = requests[reqIndex];
    requests.splice(reqIndex, 1);
    state.loanRequests = requests;

    await persistGame(state);
    broadcastNotification(`${req.playerName}'s loan request rejected`, 'error');
    return { success: true };
  }, [gameState, addToast, broadcastNotification, persistGame]);

  const currentPlayer = gameState?.players?.find(p => p.id === currentPlayerId) || null;

  return (
    <GameContext.Provider value={{
      gameState, loading, toasts, addToast,
      currentPlayerId, currentPlayer, login, logout,
      createGame, transferMoney, takeLoan, repayLoan, endGame, restartGame,
      payBank, bankPayPlayer, broadcastNotification,
      requestLoan, approveLoanRequest, rejectLoanRequest
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
