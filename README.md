# ♔ ChessMate

A premium, modern, and highly interactive multiplayer-ready chess web application featuring a glassy, dark-themed UI, 3D chess pieces animations, and real-time custom time controls. Inspired by Chess.com and built with a Flask python backend and a React (Vite) frontend.

---

## ✨ Features

### 🎮 Premium Gameplay & Engine
- **Full Chess Engine**: Real-time legal move validation (sliding pieces, pawns, knights, kings), capture detection, turn tracking, and check/checkmate detection.
- **Advanced Chess Rules**: Fully supports special moves:
  - 🏰 Castling (Kingside & Queenside validation)
  - ♟️ En Passant
  - 👑 Pawn Promotion (interactive modal selection)
- **Game Control Log**: Live move history log using standard algebraic notation.
- **Undo / Redo System**: Easily reverse and replay moves with action history tracking.
- **Resignation & Auto-Timeout**: Complete game state flow from checkmate to resigning.

### 🎨 Stunning Visual Design & Animations
- **3D Cinematic Shattering Intro**: High-quality 3D board collapse/shatter animation on first load, ending in a dramatic checkmate sequence and board explosion paired with custom cracking sound effects.
- **Board Pieces Placing Animation**: Clean animation displaying pieces assembling onto the board when starting new games.
- **Premium Glassmorphic UI**: Sleek, modern styling with customizable Neon Green (Forest Green) and Neon Blue (Navy Blue) dark themes.
- **Unscrollable Single-Page Layout**: Completely responsive viewport design that fits perfectly within the screen height with no scrollbars.

### ⏱️ Custom Tournament Clocks
- Flexible time controls (e.g., Bullet, Blitz, Rapid, or Infinite).
- **Tournament Timer Freeze**: Timers remain frozen at game start, only starting to tick down for the respective players after the first active move is made.

---

## 🛠️ Project Structure

```
ChessMate/
├── app.py                  # Flask Application entry point
├── requirements.txt        # Python backend dependencies
├── .gitignore              # Production-grade Git ignore file
├── README.md               # Project documentation
├── chess/                  # Core Python Chess Engine
│   ├── board.py            # Board representation and grid management
│   ├── piece.py            # Chess piece class definitions
│   ├── moves.py            # Move validation and logic
│   ├── rules.py            # Special rules (Castling, En Passant, Promotion)
│   ├── constants.py        # Color/Piece type definitions
│   └── game.py             # Game session controllers & timers
├── routes/                 # Flask HTTP API endpoints
│   └── api.py              # API routes mapping backend engine to frontend
└── frontend/               # React client-side application
    ├── package.json        # Node.js manifest
    ├── vite.config.js      # Vite compilation configuration
    ├── public/             # Static public assets (sounds, SVG pieces)
    └── src/                # React source code
        ├── App.jsx         # Main App layout & game coordinator
        ├── index.css       # Core design system & theme variables
        ├── components/     # UI Component library
        │   ├── Board       # Interactive Chessboard grid
        │   ├── GamePanel   # Game status tracker, move logs, & controls
        │   ├── Lobby       # Match creation settings & options
        │   └── Modals      # Promotion & Game Over overlays
        ├── hooks/          # React hooks (useGame, useTimer)
        └── utils/          # Auxiliary services (sound helpers, APIs)
```

---

## 🚀 Getting Started

### 📋 Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Run the Python Flask Backend
From the root directory:
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate       # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python app.py
```
The Flask backend will start running at `http://localhost:5000`.

### 2. Run the React Frontend (Dev mode)
In a separate terminal, navigate to the `frontend` directory:
```bash
cd frontend

# Install Node modules
npm install

# Start Vite dev server
npm run dev
```
The frontend will start running at `http://localhost:5173`. Alternatively, run `npm run build` to output production static assets directly into the Flask public static folder for unified serving at `http://localhost:5000`.

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/state` | Retrieves the current board state, move history, turn color, check status, and timer configurations. |
| `POST` | `/api/new-game` | Starts a new match using a custom config: `{ timer_mode, time_seconds, increment, undo_enabled }`. |
| `POST` | `/api/move` | Attempts to commit a move: `{ from: [row, col], to: [row, col] }`. |
| `POST` | `/api/promote` | Commits promotion piece type: `{ piece_type }`. |
| `POST` | `/api/undo` | Rolls back the game state by one move pair. |
| `POST` | `/api/redo` | Re-commits the most recently undone move. |
| `POST` | `/api/resign` | Declares resignation for active color: `{ color }`. |
| `POST` | `/api/tick` | Ticks game timer clocks and syncs countdown times. |

---

## 🏆 Development Guidelines
- All code follows strict linting standards.
- Keep components small, focused, and reusable.
- To prevent UI flicker, component remounts are managed key-wise.
