# 🏦 Monopoly Banker

A real-time digital banker for Monopoly board games. Eliminates paper money — manage player balances, transfers, loans, and payments from any device with live sync.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel&logoColor=white)

## Features

- **Multi-player real-time sync** — All devices see balance changes instantly via Firebase Realtime Database
- **Player authentication** — Each player gets a secret key at game creation; only you can perform actions on your account
- **Transfers** — Send money to any other player
- **Loan request workflow** — Players request loans, which must be approved or rejected from the Bank modal (you can't approve your own request)
- **Loan repayment** — Repay outstanding loans at any time
- **Pay Bank / Bank pays player** — Handle rent, fines, Chance cards, Community Chest, etc.
- **Bank modal** — View bank stats, loan breakdown per player, pending loan requests, give loans, and pay players
- **Notification broadcasting** — All transactions broadcast real-time toast notifications to every device with sound effects and haptic feedback
- **Loan repay reminders** — Nudge players to repay via the 🔔 button in the Bank modal
- **Dark / Light theme** — Toggle between themes, preference saved locally
- **Responsive design** — Works on desktop, tablet, and mobile
- **End game summary** — See final standings with detailed transaction history per player

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React 18, Vite                |
| Database  | Firebase Realtime Database    |
| Hosting   | Vercel (static)               |
| Styling   | CSS custom properties (no lib)|
| Audio     | Web Audio API (synthesized)   |
| Haptics   | Vibration API                 |

## Project Structure

```text
MONOPOLY/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx           # Root: routing + login gate
│   │   │   ├── Dashboard.jsx     # Main game view with cards grid
│   │   │   ├── Header.jsx        # Logo, game actions, logged-in player
│   │   │   ├── PlayerCard.jsx    # Player balance card
│   │   │   ├── PlayerModal.jsx   # Player details + actions
│   │   │   ├── BankCard.jsx      # Bank summary card
│   │   │   ├── BankModal.jsx     # Bank actions + loan requests
│   │   │   ├── NewGameForm.jsx   # Game creation form
│   │   │   ├── LoginScreen.jsx   # Secret key auth screen
│   │   │   ├── GameOver.jsx      # End game summary
│   │   │   └── ThemeToggle.jsx   # Dark/light mode switch
│   │   ├── context/
│   │   │   ├── GameContext.jsx   # All game state & actions
│   │   │   └── ThemeContext.jsx  # Theme state
│   │   ├── styles/
│   │   │   └── index.css         # All styles
│   │   ├── firebase.js           # Firebase config
│   │   ├── sounds.js             # Notification sounds & vibration
│   │   └── main.jsx              # Entry point
│   ├── index.html
│   └── package.json
├── vercel.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Realtime Database enabled

### Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/qatada16/monopoly.git
   cd monopoly
   ```

2. **Install dependencies**

   ```bash
   cd client
   npm install
   ```

3. **Configure Firebase**

   Create `client/.env.local` with your Firebase credentials:

   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebasedatabase.app
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. **Run locally**

   ```bash
   npm run dev
   ```

### Deploy to Vercel

1. Import the GitHub repo in Vercel
2. Set **Root Directory** to `client`
3. Set **Framework** to Vite
4. Add all `VITE_FIREBASE_*` environment variables in Vercel project settings
5. Deploy

## How to Play

1. **Create a game** — Set player names, secret keys, starting cash, and max loan per player
2. **Share keys** — Each player enters their secret key on their own device to log in
3. **Play** — Open your card to transfer money, request loans, pay the bank, or repay loans
4. **Bank actions** — Anyone can open the Bank to approve/reject loan requests, give loans, or pay players (you can't approve your own loan request or give yourself a loan from the bank)
5. **End game** — View final standings and full transaction history

## License

MIT
