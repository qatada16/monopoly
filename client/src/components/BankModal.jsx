import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext.jsx';

export default function BankModal({ onClose }) {
  const { gameState, takeLoan, bankPayPlayer, broadcastNotification } = useGame();
  const [action, setAction] = useState(null); // 'give_loan' | 'pay_player'
  const [playerId, setPlayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const players = gameState?.players || [];

  const selectedPlayer = players.find(p => p.id === playerId);
  const maxLoanForSelected = selectedPlayer ? selectedPlayer.maxLoan - selectedPlayer.loanTaken : 0;

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleAction = async () => {
    if (!playerId || !amount || Number(amount) <= 0) return;
    setLoading(true);

    let res;
    if (action === 'give_loan') {
      res = await takeLoan(playerId, amount);
    } else if (action === 'pay_player') {
      res = await bankPayPlayer(playerId, amount);
    }

    setLoading(false);
    if (res?.success) {
      setAction(null);
      setPlayerId('');
      setAmount('');
    }
  };

  // Gather loan info per player
  const loanDetails = players
    .filter(p => p.loanTaken > 0)
    .map(p => ({ name: p.name, loanTaken: p.loanTaken, maxLoan: p.maxLoan }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="modal-header">
          <div className="modal-avatar bank-avatar" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>🏦</div>
          <div>
            <h2 className="modal-name">The Bank</h2>
            <p className="modal-balance">${gameState.bank.totalDistributed.toLocaleString()} distributed</p>
          </div>
        </div>

        <div className="modal-stats">
          <div className="modal-stat">
            <span className="stat-label">Total Distributed</span>
            <span className="stat-value">${gameState.bank.totalDistributed.toLocaleString()}</span>
          </div>
          <div className="modal-stat">
            <span className="stat-label">Loans Outstanding</span>
            <span className="stat-value loans-out">${gameState.bank.loansGiven.toLocaleString()}</span>
          </div>
          <div className="modal-stat">
            <span className="stat-label">Players</span>
            <span className="stat-value">{players.length}</span>
          </div>
          <div className="modal-stat">
            <span className="stat-label">Start Cash</span>
            <span className="stat-value">${gameState.config.initialAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Loan breakdown */}
        {loanDetails.length > 0 && (
          <div className="bank-loan-breakdown">
            <h4 className="transactions-title">Loan Breakdown</h4>
            <div className="loan-breakdown-list">
              {loanDetails.map((p, i) => (
                <div key={i} className="loan-breakdown-item">
                  <span className="loan-breakdown-name">{p.name}</span>
                  <span className="loan-breakdown-amount">${p.loanTaken.toLocaleString()} / ${p.maxLoan.toLocaleString()}</span>
                  <button
                    className="btn-notify"
                    title={`Remind ${p.name} to repay`}
                    onClick={() => broadcastNotification(`⚠️ ${p.name}, please repay your $${p.loanTaken.toLocaleString()} loan!`, 'warning')}
                  >
                    🔔
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bank Actions */}
        {gameState.gameActive && (
          <div className="modal-actions">
            <button
              className={`btn btn-action ${action === 'give_loan' ? 'active' : ''}`}
              onClick={() => { setAction(action === 'give_loan' ? null : 'give_loan'); setPlayerId(''); setAmount(''); }}
            >
              🏦 Give Loan
            </button>
            <button
              className={`btn btn-action ${action === 'pay_player' ? 'active' : ''}`}
              onClick={() => { setAction(action === 'pay_player' ? null : 'pay_player'); setPlayerId(''); setAmount(''); }}
            >
              🎰 Pay Player
            </button>
          </div>
        )}

        {action && (
          <form className="action-form" onSubmit={e => { e.preventDefault(); handleAction(); }}>
            <div className="form-section">
              <label className="form-label">Player</label>
              <select className="input select" value={playerId} onChange={e => { setPlayerId(e.target.value); setAmount(''); }}>
                <option value="">Select player...</option>
                {players
                  .filter(p => action !== 'give_loan' || (p.maxLoan - p.loanTaken) > 0)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
            </div>
            <div className="form-section">
              <label className="form-label">Amount ($)</label>
              <input
                type="number"
                className="input"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                max={action === 'give_loan' ? maxLoanForSelected : undefined}
                placeholder="Enter amount"
              />
              {action === 'give_loan' && selectedPlayer && (
                <span className="form-hint">Max loan: ${maxLoanForSelected.toLocaleString()}</span>
              )}
              {action === 'pay_player' && (
                <span className="form-hint">Lucky draw, Chance card, etc.</span>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !playerId || !amount || Number(amount) <= 0}
            >
              {loading ? <span className="spinner" /> : 'Confirm'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
