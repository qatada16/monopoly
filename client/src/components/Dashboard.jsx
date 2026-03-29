import { useState } from 'react';
import PlayerCard from './PlayerCard.jsx';
import BankCard from './BankCard.jsx';
import PlayerModal from './PlayerModal.jsx';
import BankModal from './BankModal.jsx';
import { useGame } from '../context/GameContext.jsx';

export default function Dashboard() {
  const { gameState } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showBankModal, setShowBankModal] = useState(false);

  if (!gameState) return null;

  return (
    <div className="dashboard">
      <div className="cards-grid">
        <BankCard
          bank={gameState.bank}
          config={gameState.config}
          playerCount={gameState.players.length}
          onClick={() => setShowBankModal(true)}
        />
        {gameState.players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            onClick={() => setSelectedPlayer(player)}
          />
        ))}
      </div>

      {selectedPlayer && (
        <PlayerModal
          player={gameState.players.find(p => p.id === selectedPlayer.id) || selectedPlayer}
          allPlayers={gameState.players}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {showBankModal && (
        <BankModal onClose={() => setShowBankModal(false)} />
      )}
    </div>
  );
}
