import ThemeToggle from './ThemeToggle.jsx';
import { useGame } from '../context/GameContext.jsx';

export default function Header() {
  const { gameState, endGame, restartGame, currentPlayer, logout } = useGame();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">
          <span className="logo-icon">🏦</span>
          <span className="logo-text">Monopoly Banker</span>
        </h1>
      </div>

      <div className="header-right">
        {currentPlayer && (
          <div className="header-player-info">
            <span className="header-player-name">👤 {currentPlayer.name}</span>
            <button className="btn btn-outline btn-sm btn-logout" onClick={logout} title="Switch player">
              🔓
            </button>
          </div>
        )}
        {gameState?.gameActive && (
          <div className="header-actions">
            <button className="btn btn-outline btn-sm" onClick={restartGame}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span className="btn-label">New Game</span>
            </button>
            <button className="btn btn-danger btn-sm" onClick={endGame}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
              <span className="btn-label">End Game</span>
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
