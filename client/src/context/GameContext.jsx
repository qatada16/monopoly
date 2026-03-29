import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { db } from '../firebase.js';
import { ref, set, onValue, remove } from 'firebase/database';

const GameContext = createContext();
const GAME_REF = 'currentGame';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const skipNextSync = useRef(false);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Listen to Firebase in real-time — every device gets updates instantly
  useEffect(() => {
    const gameRef = ref(db, GAME_REF);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      // Firebase stores arrays as objects — convert players back to array
      if (data && data.players) {
        data.players = Object.values(data.players).map(p => ({
          ...p,
          transactions: p.transactions ? Object.values(p.transactions) : []
        }));
      }
      setGameState(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const createGame = useCallback(async ({ playerNames, initialAmount, maxLoanPerPlayer }) => {
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

    const players = playerNames.map(name => ({
      id: generateId(),
      name: name.trim(),
      balance: initialAmount,
      loanTaken: 0,
      maxLoan: maxLoanPerPlayer,
      transactions: []
    }));

    const state = {
      gameActive: true,
      players,
      bank: { totalDistributed: initialAmount * players.length, loansGiven: 0 },
      config: { initialAmount, maxLoanPerPlayer },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await persistGame(state);
    addToast('Game started!');
    return { success: true };
  }, [addToast, persistGame]);

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
    addToast(`${sender.name} paid $${amount} to ${recipient.name}`);
    return { success: true };
  }, [gameState, addToast, persistGame]);

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
    addToast(`${player.name} took a $${amount} loan`);
    return { success: true };
  }, [gameState, addToast, persistGame]);

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
    addToast(`${player.name} repaid $${amount}`);
    return { success: true };
  }, [gameState, addToast, persistGame]);

  const endGame = useCallback(async () => {
    if (!gameState) return { success: false };
    const state = { ...gameState, gameActive: false, lastUpdated: new Date().toISOString() };
    await persistGame(state);
    addToast('Game ended!', 'info');
    return { success: true };
  }, [gameState, addToast, persistGame]);

  const restartGame = useCallback(async () => {
    await persistGame(null);
    addToast('Game cleared! Start a new one.', 'info');
    return { success: true };
  }, [addToast, persistGame]);

  return (
    <GameContext.Provider value={{
      gameState, loading, toasts, addToast,
      createGame, transferMoney, takeLoan, repayLoan, endGame, restartGame
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
