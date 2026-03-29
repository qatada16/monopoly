import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';

export default function PlayerModal({ player, allPlayers, onClose }) {
  const { transferMoney, takeLoan, repayLoan } = useGame();
  const [action, setAction] = useState(null); // 'transfer' | 'loan' | 'repay'
  const [amount, setAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [loading, setLoading] = useState(false);

  const others = allPlayers.filter(p => p.id !== player.id);
  const remainingLoan = player.maxLoan - player.loanTaken;

  const handleAction = async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);

    let res;
    if (action === 'transfer') {
      if (!recipientId) { setLoading(false); return; }
      res = await transferMoney(player.id, recipientId, amount);
    } else if (action === 'loan') {
      res = await takeLoan(player.id, amount);
    } else if (action === 'repay') {
      res = await repayLoan(player.id, amount);
    }

    setLoading(false);
    if (res?.success) {
      setAction(null);
      setAmount('');
      setRecipientId('');
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'transfer_out': return '↗️';
      case 'transfer_in': return '↙️';
      case 'loan_taken': return '🏦';
      case 'loan_repaid': return '✅';
      default: return '💰';
    }
  };

  const getTransactionLabel = (tx) => {
    switch (tx.type) {
      case 'transfer_out': return `Paid $${tx.amount} to ${tx.to}`;
      case 'transfer_in': return `Received $${tx.amount} from ${tx.from}`;
      case 'loan_taken': return `Took $${tx.amount} loan`;
      case 'loan_repaid': return `Repaid $${tx.amount} loan`;
      default: return '';
    }
  };

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
          <div className="modal-avatar">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="modal-name">{player.name}</h2>
            <p className="modal-balance">${player.balance.toLocaleString()}</p>
          </div>
        </div>

        <div className="modal-stats">
          <div className="modal-stat">
            <span className="stat-label">Loan Taken</span>
            <span className="stat-value">${player.loanTaken.toLocaleString()}</span>
          </div>
          <div className="modal-stat">
            <span className="stat-label">Loan Available</span>
            <span className="stat-value">${remainingLoan.toLocaleString()}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="modal-actions">
          <button
            className={`btn btn-action ${action === 'transfer' ? 'active' : ''}`}
            onClick={() => { setAction(action === 'transfer' ? null : 'transfer'); setAmount(''); setRecipientId(''); }}
          >
            💸 Transfer
          </button>
          {remainingLoan > 0 && (
            <button
              className={`btn btn-action ${action === 'loan' ? 'active' : ''}`}
              onClick={() => { setAction(action === 'loan' ? null : 'loan'); setAmount(''); }}
            >
              🏦 Take Loan
            </button>
          )}
          {player.loanTaken > 0 && (
            <button
              className={`btn btn-action ${action === 'repay' ? 'active' : ''}`}
              onClick={() => { setAction(action === 'repay' ? null : 'repay'); setAmount(''); }}
            >
              ✅ Repay Loan
            </button>
          )}
        </div>

        {/* Action form */}
        {action && (
          <div className="action-form">
            {action === 'transfer' && (
              <div className="form-section">
                <label className="form-label">Recipient</label>
                <select className="input select" value={recipientId} onChange={e => setRecipientId(e.target.value)}>
                  <option value="">Select player...</option>
                  {others.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-section">
              <label className="form-label">Amount ($)</label>
              <input
                type="number"
                className="input"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                max={
                  action === 'transfer' ? player.balance :
                  action === 'loan' ? remainingLoan :
                  Math.min(player.loanTaken, player.balance)
                }
                placeholder="Enter amount"
              />
              <span className="form-hint">
                {action === 'transfer' && `Max: $${player.balance.toLocaleString()}`}
                {action === 'loan' && `Max: $${remainingLoan.toLocaleString()}`}
                {action === 'repay' && `Max: $${Math.min(player.loanTaken, player.balance).toLocaleString()}`}
              </span>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAction}
              disabled={loading || !amount || Number(amount) <= 0 || (action === 'transfer' && !recipientId)}
            >
              {loading ? <span className="spinner" /> : 'Confirm'}
            </button>
          </div>
        )}

        {/* Transactions */}
        <div className="modal-transactions">
          <h4 className="transactions-title">Transaction History</h4>
          {player.transactions.length === 0 ? (
            <p className="no-transactions">No transactions yet</p>
          ) : (
            <div className="transaction-list">
              {[...player.transactions].reverse().map((tx, i) => (
                <div key={i} className={`transaction-item tx-${tx.type}`}>
                  <span className="tx-icon">{getTransactionIcon(tx.type)}</span>
                  <span className="tx-label">{getTransactionLabel(tx)}</span>
                  <span className="tx-time">{formatTime(tx.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
