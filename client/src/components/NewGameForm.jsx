import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';

export default function NewGameForm() {
  const { createGame } = useGame();
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['', '']);
  const [playerKeys, setPlayerKeys] = useState(['', '']);
  const [initialAmount, setInitialAmount] = useState(1500);
  const [maxLoan, setMaxLoan] = useState(1000);
  const [loading, setLoading] = useState(false);

  const handleCountChange = (count) => {
    const c = Math.max(2, Math.min(8, Number(count)));
    setPlayerCount(c);
    setPlayerNames(prev => {
      const arr = [...prev];
      while (arr.length < c) arr.push('');
      return arr.slice(0, c);
    });
    setPlayerKeys(prev => {
      const arr = [...prev];
      while (arr.length < c) arr.push('');
      return arr.slice(0, c);
    });
  };

  const handleNameChange = (index, value) => {
    setPlayerNames(prev => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
  };

  const handleKeyChange = (index, value) => {
    setPlayerKeys(prev => {
      const arr = [...prev];
      arr[index] = value;
      return arr;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const names = playerNames.map(n => n.trim()).filter(Boolean);
    const keys = playerKeys.map(k => k.trim()).filter(Boolean);
    if (names.length < 2 || keys.length !== names.length) return;
    setLoading(true);
    await createGame({
      playerNames: names,
      playerKeys: keys,
      initialAmount: Number(initialAmount),
      maxLoanPerPlayer: Number(maxLoan)
    });
    setLoading(false);
  };

  const allNamesFilled = playerNames.every(n => n.trim().length > 0);
  const allKeysFilled = playerKeys.every(k => k.trim().length > 0);

  return (
    <div className="new-game-container">
      <div className="new-game-card">
        <div className="new-game-header">
          <h2>🎲 New Game</h2>
          <p>Set up your Monopoly banking session</p>
        </div>

        <form onSubmit={handleSubmit} className="new-game-form">
          <div className="form-section">
            <label className="form-label">Number of Players</label>
            <div className="player-count-selector">
              <button type="button" className="count-btn" onClick={() => handleCountChange(playerCount - 1)} disabled={playerCount <= 2}>−</button>
              <span className="count-display">{playerCount}</span>
              <button type="button" className="count-btn" onClick={() => handleCountChange(playerCount + 1)} disabled={playerCount >= 8}>+</button>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Player Names & Keys</label>
            <div className="player-names-grid">
              {playerNames.map((name, i) => (
                <div key={i} className="player-entry">
                  <div className="player-name-input-wrapper">
                    <span className="player-number">P{i + 1}</span>
                    <input
                      type="text"
                      className="input"
                      placeholder={`Player ${i + 1}`}
                      value={name}
                      onChange={(e) => handleNameChange(i, e.target.value)}
                      maxLength={20}
                    />
                  </div>
                  <input
                    type="text"
                    className="input key-input secret-key-field"
                    placeholder={`Key for ${name.trim() || `Player ${i + 1}`}`}
                    value={playerKeys[i]}
                    onChange={(e) => handleKeyChange(i, e.target.value)}
                    maxLength={30}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label className="form-label">Starting Cash ($)</label>
              <input
                type="number"
                className="input"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                min="100"
                step="100"
              />
            </div>
            <div className="form-section">
              <label className="form-label">Max Loan per Player ($)</label>
              <input
                type="number"
                className="input"
                value={maxLoan}
                onChange={(e) => setMaxLoan(e.target.value)}
                min="0"
                step="100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg start-btn"
            disabled={!allNamesFilled || !allKeysFilled || loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Game
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
