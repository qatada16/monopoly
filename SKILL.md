---
name: monopoly-banker
description: Build and maintain a real-time Monopoly banking web application for tracking player cash, transfers, and loans during physical board game sessions. Pure frontend React app with Firebase Realtime Database for cross-device sync. Use this skill when working on the Monopoly banker webapp — adding features, fixing bugs, modifying UI, adjusting game logic. Also use when the user mentions monopoly money tracker, board game cash manager, or player transaction features.
---

# Monopoly Banker — Real-Time Cash Tracker

A React app that replaces physical cash in Monopoly. All players open the app on their own devices and see live updates as money moves. Game state is stored as JSON in Firebase Realtime Database. Deployed as a static site on Vercel.

## Architecture

```
MONOPOLY/
├── client/                — React (Vite) frontend — this IS the app
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── firebase.js    — Firebase init + db export
│   │   ├── context/       — ThemeContext, GameContext (Firebase-backed)
│   │   ├── components/    — PlayerCard, PlayerModal, NewGameForm, Toast, ThemeToggle, Header, BankCard, GameOver
│   │   └── styles/        — Global CSS, theme variables, animations
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── vercel.json            — Vercel deployment config
├── SKILL.md
└── package.json
```

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 18 + Vite | Fast dev, tiny bundle, deploys anywhere |
| Storage | Firebase Realtime Database | JSON tree, real-time sync across devices, free tier |
| Styling | CSS custom properties | Full dark/light theme control, zero deps |
| Deployment | Vercel (static) | Free, instant deploys, CDN |

## Game State Shape (stored at Firebase path `currentGame`)

```json
{
  "gameActive": true,
  "players": [
    {
      "id": "k7f3a9x2bc",
      "name": "Player 1",
      "balance": 1500,
      "loanTaken": 0,
      "maxLoan": 1000,
      "transactions": [
        { "type": "transfer_out", "to": "Player 2", "amount": 200, "timestamp": "..." }
      ]
    }
  ],
  "bank": {
    "totalDistributed": 6000,
    "loansGiven": 0
  },
  "config": {
    "initialAmount": 1500,
    "maxLoanPerPlayer": 1000
  },
  "createdAt": "...",
  "lastUpdated": "..."
}
```

## Core Features

### 1. New Game Setup
- Form: number of players, player names, initial cash, max loan per player
- Creates fresh game state in localStorage
- Validates: at least 2 players, positive amounts, unique names

### 2. Player Cards Dashboard
- Grid of cards showing each player: name, balance, loan status, recent activity
- Bank card always visible showing distributed total and outstanding loans
- React state = instant UI updates on every action

### 3. Player Modal (on card click)
- Detailed view: full transaction history, loan breakdown
- Action buttons:
  - **Transfer Money** → select recipient + enter amount (validated against balance)
  - **Take Loan** → enter amount (validated against remaining loan allowance)
  - **Repay Loan** → enter amount (only visible if loan > 0, validated against balance)
- Every action updates React state + localStorage simultaneously

### 4. Validation Rules
All mutations are validated in GameContext before applying:
- Transfer: amount > 0, sender has sufficient balance, recipient exists, not self-transfer
- Loan: amount > 0, player hasn't exceeded max loan, game is active
- Repay: amount > 0, amount ≤ current loan, player has sufficient balance

### 5. Feedback & UX
- Toast notifications on every action (success/error) with auto-dismiss + progress bar
- Balance flash animation (green glow for gain, red for loss)
- Hover effects on cards, button press scale, modal slide-in

### 6. End / Restart Game
- End game: shows final standings sorted by balance
- Restart: clears localStorage, shows new game form

## UI / Styling Rules

### Color Scheme
- **Dark mode** (default): bg `#0f0f1a`, cards `#1a1a2e`, accent `#e94560`, secondary `#16213e`
- **Light mode**: bg `#f0f0f5`, cards `#ffffff`, accent `#c81e4d`, secondary `#e8e8f0`
- Theme toggle with smooth sun/moon icon animation in header

### Responsiveness
- Desktop: 3-4 column card grid
- Tablet: 2 column grid
- Mobile (<480px): single column stack, bottom sheet modal instead of centered modal, larger touch targets
- All interactive elements minimum 44px touch target

### Animations
- Card hover: subtle lift + shadow
- Modal: slide up with backdrop fade (bottom sheet on mobile)
- Toast: slide in from top-right, auto-dismiss with progress bar
- Balance change: brief color flash (green for +, red for -)
- Theme toggle: smooth icon rotation + color transition

## Deployment

Deploy to Vercel as a static site:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd MONOPOLY
vercel
```

The `vercel.json` config handles build command and SPA routing.

**Usage:** One device (phone/tablet) runs the app as the banker. Everyone plays at the same table — the banker device handles all transactions.

## Development Commands

```bash
# Install dependencies
cd client && npm install

# Dev mode
cd client && npm run dev

# Production build
cd client && npm run build

# Preview production build
cd client && npm run preview
```
