import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Modern, minimalistic Tic Tac Toe app.
 * Light theme, responsive design, supports Player vs Player and Player vs AI,
 * includes restart/reset and a score tracker.
 * Color scheme: accent #FFEB3B, primary #2196F3, secondary #90CAF9
 */

// Utility constants
const COLORS = {
  primary: '#2196F3',
  secondary: '#90CAF9',
  accent: '#FFEB3B',
  text: '#1a1a1a',
  bg: '#ffffff',
  subtle: '#f6f8fb',
};

// Game Helpers
const LINES = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // cols
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diags
  [2, 4, 6],
];

function calculateWinner(squares) {
  for (const [a, b, c] of LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return squares.every(Boolean) ? { winner: 'draw', line: [] } : null;
}

function availableMoves(board) {
  return board
    .map((v, i) => (v ? null : i))
    .filter((v) => v !== null);
}

// Simple AI: tries to win, then block, otherwise center/corners/random
function aiMove(board, ai = 'O', human = 'X') {
  const moves = availableMoves(board);
  if (moves.length === 0) return null;

  // 1. Win if possible
  for (const m of moves) {
    const test = board.slice();
    test[m] = ai;
    if (calculateWinner(test)?.winner === ai) return m;
  }

  // 2. Block if human can win next
  for (const m of moves) {
    const test = board.slice();
    test[m] = human;
    if (calculateWinner(test)?.winner === human) return m;
  }

  // 3. Center
  if (moves.includes(4)) return 4;

  // 4. Corners
  const corners = [0, 2, 6, 8].filter((c) => moves.includes(c));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  // 5. Any move
  return moves[Math.floor(Math.random() * moves.length)];
}

// PUBLIC_INTERFACE
export default function App() {
  /** This is the Tic Tac Toe application root component. */
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('pvp'); // 'pvp' | 'pvai'
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [startingPlayer, setStartingPlayer] = useState('X'); // alternates on restart for fairness
  const [highlight, setHighlight] = useState([]);

  const status = useMemo(() => {
    const result = calculateWinner(board);
    if (result) {
      if (result.winner === 'draw') return "It's a draw!";
      return `Winner: ${result.winner}`;
    }
    return `Next turn: ${xIsNext ? 'X' : 'O'}`;
  }, [board, xIsNext]);

  // Handle wins/draws and highlight line
  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      if (result.winner !== 'draw') {
        setHighlight(result.line);
        setScores((s) => ({ ...s, [result.winner]: s[result.winner] + 1 }));
      } else {
        setScores((s) => ({ ...s, draw: s.draw + 1 }));
      }
    } else {
      setHighlight([]);
    }
  }, [board]);

  // AI turn effect
  useEffect(() => {
    const result = calculateWinner(board);
    if (mode === 'pvai' && !result) {
      const currentPlayer = xIsNext ? 'X' : 'O';
      if (currentPlayer === 'O') {
        const timer = setTimeout(() => {
          const move = aiMove(board, 'O', 'X');
          if (move !== null) {
            handleMove(move);
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, xIsNext, mode]);

  function handleMove(index) {
    const result = calculateWinner(board);
    if (result || board[index]) return; // ignore moves after game end or occupied

    setBoard((prev) => {
      const next = prev.slice();
      next[index] = xIsNext ? 'X' : 'O';
      return next;
    });
    setXIsNext((prev) => !prev);
  }

  // PUBLIC_INTERFACE
  function restartRound(alternateStarter = true) {
    /** Restart the current round. Alternates starting player by default. */
    setBoard(Array(9).fill(null));
    if (alternateStarter) {
      const nextStarter = startingPlayer === 'X' ? 'O' : 'X';
      setStartingPlayer(nextStarter);
      setXIsNext(nextStarter === 'X');
    } else {
      setXIsNext(startingPlayer === 'X');
    }
    setHighlight([]);
  }

  // PUBLIC_INTERFACE
  function resetMatch() {
    /** Reset scores and board to initial state. */
    setScores({ X: 0, O: 0, draw: 0 });
    setStartingPlayer('X');
    setXIsNext(true);
    setBoard(Array(9).fill(null));
    setHighlight([]);
  }

  // PUBLIC_INTERFACE
  function changeMode(newMode) {
    /** Change game mode between Player vs Player and Player vs AI. */
    setMode(newMode);
    // On mode change, start a fresh round but keep the scores
    restartRound(false);
  }

  return (
    <div className="app-root" style={styles.appRoot}>
      <header style={styles.header}>
        <h1 style={styles.title}>Tic Tac Toe</h1>
        <p style={styles.subtitle}>Modern, minimal, light UI</p>
      </header>

      <section style={styles.controlsWrap}>
        <div style={styles.modeGroup} role="group" aria-label="Game mode">
          <button
            onClick={() => changeMode('pvp')}
            style={{
              ...styles.modeButton,
              ...(mode === 'pvp' ? styles.modeButtonActive : {}),
            }}
            aria-pressed={mode === 'pvp'}
          >
            Player vs Player
          </button>
          <button
            onClick={() => changeMode('pvai')}
            style={{
              ...styles.modeButton,
              ...(mode === 'pvai' ? styles.modeButtonActive : {}),
            }}
            aria-pressed={mode === 'pvai'}
          >
            Player vs AI
          </button>
        </div>

        <div style={styles.actions}>
          <button onClick={() => restartRound()} style={styles.secondaryButton} aria-label="Restart round">
            Restart
          </button>
          <button onClick={resetMatch} style={styles.primaryButton} aria-label="Reset scores and game">
            Reset
          </button>
        </div>
      </section>

      <section style={styles.statusRow} aria-live="polite">
        <div style={styles.statusBubble}>
          {status}
        </div>
      </section>

      <section style={styles.boardSection}>
        <Board
          board={board}
          onClick={handleMove}
          highlight={highlight}
        />
        <Scoreboard scores={scores} startingPlayer={startingPlayer} />
      </section>

      <footer style={styles.footer}>
        <span>Primary {COLORS.primary} • Secondary {COLORS.secondary} • Accent {COLORS.accent}</span>
      </footer>
    </div>
  );
}

// Board component
function Board({ board, onClick, highlight }) {
  return (
    <div style={styles.board} role="grid" aria-label="Tic Tac Toe board">
      {board.map((cell, idx) => {
        const isHighlighted = highlight.includes(idx);
        return (
          <button
            key={idx}
            role="gridcell"
            aria-label={`Cell ${idx + 1} ${cell ? cell : 'empty'}`}
            onClick={() => onClick(idx)}
            style={{
              ...styles.cell,
              ...(isHighlighted ? styles.cellHighlight : {}),
            }}
          >
            <span style={cell === 'X' ? styles.cellX : styles.cellO}>{cell}</span>
          </button>
        );
      })}
    </div>
  );
}

// Scoreboard component
function Scoreboard({ scores, startingPlayer }) {
  return (
    <div style={styles.score}>
      <div style={{ ...styles.scoreCard, borderTopColor: COLORS.primary }}>
        <div style={styles.scoreLabel}>X</div>
        <div style={styles.scoreValue}>{scores.X}</div>
      </div>
      <div style={{ ...styles.scoreCard, borderTopColor: COLORS.accent }}>
        <div style={styles.scoreLabel}>Draw</div>
        <div style={styles.scoreValue}>{scores.draw}</div>
      </div>
      <div style={{ ...styles.scoreCard, borderTopColor: COLORS.secondary }}>
        <div style={styles.scoreLabel}>O</div>
        <div style={styles.scoreValue}>{scores.O}</div>
      </div>
      <div style={styles.metaInfo} aria-label="Starting player">
        Starts: <strong>{startingPlayer}</strong>
      </div>
    </div>
  );
}

// Inline styles for a minimal, responsive, light-themed UI
const styles = {
  appRoot: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: COLORS.bg,
    color: COLORS.text,
    alignItems: 'center',
    padding: '24px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '12px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    letterSpacing: '0.4px',
    color: COLORS.primary,
    fontWeight: 800,
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#5f6b7a',
  },
  controlsWrap: {
    width: '100%',
    maxWidth: '680px',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: COLORS.subtle,
    borderRadius: '14px',
    padding: '12px',
    border: `1px solid rgba(0,0,0,0.05)`,
  },
  modeGroup: {
    display: 'flex',
    gap: '8px',
  },
  modeButton: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${COLORS.secondary}`,
    background: '#fff',
    color: COLORS.primary,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all .2s ease',
  },
  modeButtonActive: {
    background: COLORS.primary,
    color: '#fff',
    borderColor: COLORS.primary,
    boxShadow: '0 2px 8px rgba(33,150,243,0.25)',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  primaryButton: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: 'none',
    background: COLORS.accent,
    color: '#1a1a1a',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform .15s ease',
  },
  secondaryButton: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${COLORS.secondary}`,
    background: '#fff',
    color: COLORS.primary,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform .15s ease',
  },
  statusRow: {
    width: '100%',
    maxWidth: '680px',
    margin: '14px 0',
    display: 'flex',
    justifyContent: 'center',
  },
  statusBubble: {
    background: '#fff',
    borderRadius: '12px',
    padding: '10px 14px',
    border: `1px solid rgba(0,0,0,0.06)`,
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    fontWeight: 700,
    color: COLORS.primary,
  },
  boardSection: {
    width: '100%',
    maxWidth: '680px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    alignItems: 'start',
    justifyItems: 'center',
  },
  board: {
    width: '100%',
    maxWidth: '420px',
    aspectRatio: '1 / 1',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(3, 1fr)',
    gap: '10px',
    padding: '10px',
    background: COLORS.subtle,
    borderRadius: '16px',
    border: `1px solid rgba(0,0,0,0.05)`,
  },
  cell: {
    background: '#fff',
    border: `1px solid ${COLORS.secondary}`,
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    fontSize: '48px',
    fontWeight: 800,
    color: COLORS.primary,
    transition: 'transform .06s ease, box-shadow .2s ease, background .2s ease',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    userSelect: 'none',
  },
  cellHighlight: {
    background: '#fffbea',
    borderColor: COLORS.accent,
    boxShadow: '0 3px 14px rgba(255,235,59,0.35)',
  },
  cellX: {
    color: COLORS.primary,
    textShadow: '0 2px 0 rgba(33,150,243,0.15)',
  },
  cellO: {
    color: '#1769aa',
    textShadow: '0 2px 0 rgba(23,105,170,0.12)',
  },
  score: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  scoreCard: {
    background: '#fff',
    border: `1px solid rgba(0,0,0,0.06)`,
    borderRadius: '12px',
    padding: '12px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    display: 'grid',
    placeItems: 'center',
    borderTopWidth: '6px',
    borderTopStyle: 'solid',
  },
  scoreLabel: {
    fontSize: '12px',
    color: '#6b7a90',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '6px',
  },
  scoreValue: {
    fontSize: '20px',
    fontWeight: 800,
    color: COLORS.text,
  },
  metaInfo: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    fontSize: '12px',
    color: '#6b7a90',
    paddingTop: '6px',
  },
  footer: {
    marginTop: '24px',
    fontSize: '12px',
    color: '#98a2b3',
  },
};
