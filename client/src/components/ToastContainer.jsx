import { useGame } from '../context/GameContext.jsx';

export default function ToastContainer() {
  const { toasts } = useGame();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
          <div className="toast-progress" />
        </div>
      ))}
    </div>
  );
}
