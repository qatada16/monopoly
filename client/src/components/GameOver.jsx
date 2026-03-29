import { useGame } from '../context/GameContext.jsx';

export default function GameOver() {
  const { gameState, restartGame } = useGame();

  if (!gameState || !gameState.players) return null;

  const sorted = [...gameState.players].sort((a, b) => b.balance - a.balance);

  return (
    <div className="game-over-container">
      <div className="game-over-card">
        <h2 className="game-over-title">🏁 Game Over</h2>
        <p className="game-over-subtitle">Final Standings</p>

        <div className="standings">
          {sorted.map((player, i) => (
            <div key={player.id} className={`standing-row ${i === 0 ? 'winner' : ''}`}>
              <span className="standing-rank">
                {i === 0 ? '👑' : `#${i + 1}`}
              </span>
              <span className="standing-name">{player.name}</span>
              <span className="standing-balance">${player.balance.toLocaleString()}</span>
              {player.loanTaken > 0 && (
                <span className="standing-loan">Loan: ${player.loanTaken.toLocaleString()}</span>
              )}
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-lg" onClick={restartGame}>
          🎲 New Game
        </button>
      </div>
    </div>
  );
}
