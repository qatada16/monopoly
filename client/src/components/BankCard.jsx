export default function BankCard({ bank, config, playerCount, onClick, pendingRequests }) {
  return (
    <div className="bank-card" onClick={onClick}>
      {pendingRequests > 0 && (
        <span className="request-badge">{pendingRequests}</span>
      )}
      <div className="card-header">
        <div className="player-avatar bank-avatar">🏦</div>
        <h3 className="player-name">The Bank</h3>
      </div>

      <div className="bank-stats">
        <div className="bank-stat">
          <span className="stat-label">Distributed</span>
          <span className="stat-value">${bank.totalDistributed.toLocaleString()}</span>
        </div>
        <div className="bank-stat">
          <span className="stat-label">Loans Out</span>
          <span className="stat-value loans-out">${bank.loansGiven.toLocaleString()}</span>
        </div>
        <div className="bank-stat">
          <span className="stat-label">Players</span>
          <span className="stat-value">{playerCount}</span>
        </div>
        <div className="bank-stat">
          <span className="stat-label">Start Cash</span>
          <span className="stat-value">${config.initialAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
