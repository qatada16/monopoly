import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';

export default function LoginScreen() {
  const { login } = useGame();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    const success = login(key.trim());
    if (!success) setLoading(false);
  };

  return (
    <div className="new-game-container">
      <div className="new-game-card login-card">
        <div className="new-game-header">
          <h2>🔑 Enter Your Key</h2>
          <p>Enter your secret key to join the game</p>
        </div>
        <form onSubmit={handleSubmit} className="new-game-form">
          <div className="form-section">
            <label className="form-label">Secret Key</label>
            <input
              type="text"
              className="input secret-key-field"
              placeholder="Enter your key..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg start-btn"
            disabled={!key.trim() || loading}
          >
            {loading ? <span className="spinner" /> : 'Enter Game'}
          </button>
        </form>
      </div>
    </div>
  );
}
