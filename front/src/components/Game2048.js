import React, { useCallback, useEffect, useMemo, useState } from 'react';

const GRID_SIZE = 4;
const INITIAL_TILES = 2;
const tileColors = {
  0: { background: '#f1f5f9', color: '#94a3b8' },
  2: { background: '#e2e8f0', color: '#1f2937' },
  4: { background: '#cbd5e1', color: '#111827' },
  8: { background: '#fbbf24', color: '#fff7ed' },
  16: { background: '#f59e0b', color: '#fff7ed' },
  32: { background: '#f97316', color: '#fff7ed' },
  64: { background: '#ef4444', color: '#fff7ed' },
  128: { background: '#a855f7', color: '#f8fafc' },
  256: { background: '#8b5cf6', color: '#f8fafc' },
  512: { background: '#6366f1', color: '#f8fafc' },
  1024: { background: '#0ea5e9', color: '#f8fafc' },
  2048: { background: '#22c55e', color: '#f0fdf4' }
};

const cloneBoard = (board) => board.map((row) => [...row]);

const addRandomTile = (board) => {
  const emptyCells = [];
  board.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell === 0) emptyCells.push([rIdx, cIdx]);
    });
  });

  if (emptyCells.length === 0) return board;

  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.1 ? 4 : 2;
  const newBoard = cloneBoard(board);
  newBoard[r][c] = value;
  return newBoard;
};

const slideAndMerge = (line) => {
  const filtered = line.filter((v) => v !== 0);
  const merged = [];
  let score = 0;

  for (let i = 0; i < filtered.length; i += 1) {
    if (filtered[i] === filtered[i + 1]) {
      const value = filtered[i] * 2;
      merged.push(value);
      score += value;
      i += 1;
    } else {
      merged.push(filtered[i]);
    }
  }

  while (merged.length < GRID_SIZE) {
    merged.push(0);
  }

  return { line: merged, score };
};

export const initBoard = () => {
  let board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  for (let i = 0; i < INITIAL_TILES; i += 1) {
    board = addRandomTile(board);
  }
  return board;
};

const isBoardChanged = (before, after) => before.some((row, rIdx) => row.some((cell, cIdx) => cell !== after[rIdx][cIdx]));

export const move = (board, direction) => {
  const workingBoard = cloneBoard(board);
  let gainedScore = 0;

  const applyMove = (getLine, setLine) => {
    for (let i = 0; i < GRID_SIZE; i += 1) {
      const line = getLine(workingBoard, i);
      const { line: nextLine, score } = slideAndMerge(line);
      gainedScore += score;
      setLine(workingBoard, i, nextLine);
    }
  };

  if (direction === 'left') {
    applyMove(
      (b, r) => b[r],
      (b, r, line) => {
        b[r] = line;
      }
    );
  } else if (direction === 'right') {
    applyMove(
      (b, r) => [...b[r]].reverse(),
      (b, r, line) => {
        b[r] = [...line].reverse();
      }
    );
  } else if (direction === 'up') {
    applyMove(
      (b, c) => b.map((row) => row[c]),
      (b, c, line) => {
        line.forEach((value, rIdx) => {
          b[rIdx][c] = value;
        });
      }
    );
  } else if (direction === 'down') {
    applyMove(
      (b, c) => b.map((row) => row[c]).reverse(),
      (b, c, line) => {
        line.reverse().forEach((value, rIdx) => {
          b[rIdx][c] = value;
        });
      }
    );
  }

  const moved = isBoardChanged(board, workingBoard);
  return { board: workingBoard, gainedScore, moved };
};

export const canMove = (board) => {
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (board[r][c] === 0) return true;
      if (r < GRID_SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
      if (c < GRID_SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
    }
  }
  return false;
};

const Game2048 = () => {
  const [board, setBoard] = useState(() => initBoard());
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');

  const handleMove = useCallback(
    (direction) => {
      const { board: movedBoard, gainedScore, moved } = move(board, direction);
      if (!moved) return;

      const boardWithTile = addRandomTile(movedBoard);
      const nextScore = score + gainedScore;
      const reached2048 = boardWithTile.some((row) => row.some((cell) => cell >= 2048));
      const stillCanMove = canMove(boardWithTile);

      setBoard(boardWithTile);
      setScore(nextScore);

      if (reached2048) {
        setMessage('You win!');
      } else if (!stillCanMove) {
        setMessage('Game Over');
      } else {
        setMessage('');
      }
    },
    [board, score]
  );

  const handleKeyDown = useCallback(
    (event) => {
      const directionMap = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down'
      };
      const direction = directionMap[event.key];
      if (!direction) return;
      event.preventDefault();
      handleMove(direction);
    },
    [handleMove]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const startNewGame = () => {
    setBoard(initBoard());
    setScore(0);
    setMessage('');
  };

  const renderCell = (value, idx) => {
    const colors = tileColors[value] || { background: '#0f172a', color: '#f8fafc' };
    return (
      <div key={idx} style={{ ...styles.tile, backgroundColor: colors.background, color: colors.color }}>
        {value !== 0 ? value : ''}
      </div>
    );
  };

  const controls = useMemo(
    () => [
      { label: '↑', direction: 'up' },
      { label: '←', direction: 'left' },
      { label: '→', direction: 'right' },
      { label: '↓', direction: 'down' }
    ],
    []
  );

  return (
    <div>
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>2048 게임</h3>
          <p style={styles.helper}>키보드 방향키 또는 아래 버튼을 사용해 타일을 이동하세요.</p>
        </div>
        <div style={styles.scoreBox}>
          <div style={styles.scoreLabel}>SCORE</div>
          <div style={styles.scoreValue}>{score}</div>
        </div>
      </div>

      <div style={styles.board}>
        {board.map((row, rowIdx) => (
          <div key={rowIdx} style={styles.row}>
            {row.map((cell, cellIdx) => renderCell(cell, `${rowIdx}-${cellIdx}`))}
          </div>
        ))}
      </div>

      <div style={styles.controls}>
        {controls.map((control) => (
          <button
            key={control.direction}
            type="button"
            style={styles.controlButton}
            onClick={() => handleMove(control.direction)}
          >
            {control.label}
          </button>
        ))}
        <button type="button" style={{ ...styles.controlButton, backgroundColor: '#0ea5e9' }} onClick={startNewGame}>
          새 게임
        </button>
      </div>

      {message && <div style={styles.status}>{message}</div>}
    </div>
  );
};

const styles = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap'
  },
  title: {
    margin: '0 0 6px',
    color: '#111827'
  },
  helper: {
    margin: 0,
    color: '#6b7280'
  },
  scoreBox: {
    minWidth: '120px',
    backgroundColor: '#111827',
    color: 'white',
    padding: '10px 12px',
    borderRadius: '12px',
    textAlign: 'right'
  },
  scoreLabel: {
    fontSize: '12px',
    letterSpacing: '1px',
    color: '#e5e7eb',
    marginBottom: '4px'
  },
  scoreValue: {
    fontSize: '20px',
    fontWeight: '700'
  },
  board: {
    backgroundColor: '#cbd5e1',
    padding: '12px',
    borderRadius: '14px',
    display: 'grid',
    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
    gap: '10px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
    gap: '10px'
  },
  tile: {
    height: '72px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 700,
    transition: 'background-color 0.2s ease'
  },
  controls: {
    marginTop: '14px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  controlButton: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: '64px'
  },
  status: {
    marginTop: '14px',
    padding: '10px 12px',
    backgroundColor: '#fef3c7',
    borderRadius: '10px',
    color: '#92400e',
    border: '1px solid #f59e0b'
  }
};

export default Game2048;
