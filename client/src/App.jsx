import Header from './components/Header.jsx';
import NewGameForm from './components/NewGameForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import GameOver from './components/GameOver.jsx';
import { useGame } from './context/GameContext.jsx';

export default function App() {
  const { gameState, loading } = useGame();

  const showNewGame = !loading && (!gameState || (!gameState.gameActive && !gameState.players));
  const showGameOver = !loading && gameState && !gameState.gameActive && gameState.players;
  const showDashboard = !loading && gameState && gameState.gameActive;

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        {loading && (
          <div className="loading-screen">
            <div className="spinner" />
            <p>Connecting...</p>
          </div>
        )}
        {showNewGame && <NewGameForm />}
        {showGameOver && <GameOver />}
        {showDashboard && <Dashboard />}
      </main>
      <ToastContainer />
    </div>
  );
}
