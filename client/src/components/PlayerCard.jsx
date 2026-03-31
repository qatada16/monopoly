import { useEffect, useRef, useState } from 'react';

export default function PlayerCard({ player, onClick, isCurrentPlayer }) {
  const [flash, setFlash] = useState(null);
  const prevBalance = useRef(player.balance);

  useEffect(() => {
    if (prevBalance.current !== player.balance) {
      const diff = player.balance - prevBalance.current;
      setFlash(diff > 0 ? 'gain' : 'loss');
      const timer = setTimeout(() => setFlash(null), 600);
      prevBalance.current = player.balance;
      return () => clearTimeout(timer);
    }
  }, [player.balance]);

  const loanPercent = player.maxLoan > 0 ? (player.loanTaken / player.maxLoan) * 100 : 0;

  return (
    <div className={`player-card ${flash ? `flash-${flash}` : ''} ${isCurrentPlayer ? 'player-card-own' : ''}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="card-header">
        <div className="player-avatar">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <h3 className="player-name">{player.name}</h3>
      </div>

      <div className="card-balance">
        <span className="balance-label">Balance</span>
        <span className={`balance-amount ${flash ? `text-${flash}` : ''}`}>
          ${player.balance.toLocaleString()}
        </span>
      </div>

      {player.maxLoan > 0 && (
        <div className="card-loan">
          <div className="loan-info">
            <span className="loan-label">Loan</span>
            <span className="loan-amount">${player.loanTaken.toLocaleString()} / ${player.maxLoan.toLocaleString()}</span>
          </div>
          <div className="loan-bar">
            <div className="loan-bar-fill" style={{ width: `${loanPercent}%` }} />
          </div>
        </div>
      )}

      <div className="card-footer">
        <span className="transaction-count">
          {player.transactions.length} transaction{player.transactions.length !== 1 ? 's' : ''}
        </span>
        {isCurrentPlayer ? (
          <span className="own-badge">You</span>
        ) : (
          <svg className="card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>
    </div>
  );
}
