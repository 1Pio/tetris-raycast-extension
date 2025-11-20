import { useEffect, useRef, useState, useCallback } from "react";
import {
  GameSettings,
  SavedGameState,
  ActivePiece,
  Board,
  TetrominoType,
  GameStats,
  Difficulty,
} from "../types";
import {
  createEmptyBoard,
  checkCollision,
  mergePieceToBoard,
  clearLines,
  getRandomTetrominoType,
} from "../engine/game-logic";
import { PALETTES, TICK_INTERVAL_BASE_MS } from "../constants";
import { saveGameState, clearSavedGame, loadStats, saveStats } from "../storage";

export function useTetrisGame(
  initialSettings: GameSettings,
  savedGame: SavedGameState | null,
  onGameOver: () => void
) {
  const [board, setBoard] = useState<Board>(savedGame?.board || createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<ActivePiece>(
    savedGame?.currentPiece || {
      type: getRandomTetrominoType(),
      position: { x: 3, y: 0 },
      rotation: 0,
    }
  );
  const [nextQueue, setNextQueue] = useState<TetrominoType[]>(
    savedGame?.nextQueue || [getRandomTetrominoType(), getRandomTetrominoType(), getRandomTetrominoType()]
  );
  const [heldPiece, setHeldPiece] = useState<TetrominoType | null>(savedGame?.heldPiece || null);
  const [holdUsed, setHoldUsed] = useState<boolean>(savedGame?.holdUsed || false);

  const [score, setScore] = useState<number>(savedGame?.score || 0);
  const [level, setLevel] = useState<number>(savedGame?.level || 1);
  const [rowsCleared, setRowsCleared] = useState<number>(savedGame?.rowsCleared || 0);
  const [comboCount, setComboCount] = useState<number>(savedGame?.comboCount || 0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Time tracking
  const [startedAt] = useState<number>(savedGame?.startedAt || Date.now());
  const [totalActivePlayTimeMs, setTotalActivePlayTimeMs] = useState<number>(
    savedGame?.totalActivePlayTimeMs || 0
  );
  const lastTickTime = useRef<number>(Date.now());

  const settingsRef = useRef(initialSettings);

  // Calculate Speed
  const getSpeed = useCallback(() => {
    const diffMultiplier =
      initialSettings.difficulty === "medium"
        ? 1.8
        : initialSettings.difficulty === "hard"
        ? 3
        : 1;
    // Simple formula: speed increases with level
    const speed = Math.max(
      100,
      (TICK_INTERVAL_BASE_MS / diffMultiplier) * Math.pow(0.85, level - 1)
    );
    return speed;
  }, [level, initialSettings.difficulty]);

  const spawnPiece = useCallback(() => {
    const type = nextQueue[0];
    const newQueue = [...nextQueue.slice(1), getRandomTetrominoType()];
    const newPiece: ActivePiece = {
      type,
      position: { x: 3, y: 0 },
      rotation: 0,
    };

    if (checkCollision(board, newPiece)) {
      setGameOver(true);
      onGameOver();
      clearSavedGame();
    } else {
      setCurrentPiece(newPiece);
      setNextQueue(newQueue);
      setHoldUsed(false);
    }
  }, [board, nextQueue, onGameOver]);

  const lockPiece = useCallback(() => {
    const palette = PALETTES[initialSettings.colorPalette];
    const color = palette[currentPiece.type];
    const newBoard = mergePieceToBoard(board, currentPiece, color);
    
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

    // Scoring
    if (linesCleared > 0) {
      const basePoints = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 lines
      const comboBonus = comboCount * 50 * level;
      const points = basePoints[linesCleared] * level + comboBonus;
      
      setScore((prev) => prev + points);
      setRowsCleared((prev) => prev + linesCleared);
      setLevel((prev) => Math.floor((rowsCleared + linesCleared) / 10) + 1);
      setComboCount((prev) => prev + 1);
    } else {
      setComboCount(0);
    }

    setBoard(clearedBoard);
    spawnPiece();
  }, [board, currentPiece, comboCount, level, rowsCleared, initialSettings.colorPalette, spawnPiece]);

  const move = useCallback(
    (dx: number, dy: number) => {
      if (gameOver || isPaused) return false;

      const newPos = {
        x: currentPiece.position.x + dx,
        y: currentPiece.position.y + dy,
      };
      const newPiece = { ...currentPiece, position: newPos };

      if (!checkCollision(board, newPiece)) {
        setCurrentPiece(newPiece);
        return true;
      }
      
      if (dy > 0) {
        // Hit bottom or block while moving down
        lockPiece();
      }
      return false;
    },
    [board, currentPiece, gameOver, isPaused, lockPiece]
  );

  const rotate = useCallback(() => {
    if (gameOver || isPaused) return;
    const newRotation = (currentPiece.rotation + 1) % 4;
    const newPiece = { ...currentPiece, rotation: newRotation };
    
    // Basic wall kick (try moving left/right if rotation fails)
    if (!checkCollision(board, newPiece)) {
      setCurrentPiece(newPiece);
    } else if (!checkCollision(board, { ...newPiece, position: { ...newPiece.position, x: newPiece.position.x - 1 } })) {
      setCurrentPiece({ ...newPiece, position: { ...newPiece.position, x: newPiece.position.x - 1 } });
    } else if (!checkCollision(board, { ...newPiece, position: { ...newPiece.position, x: newPiece.position.x + 1 } })) {
      setCurrentPiece({ ...newPiece, position: { ...newPiece.position, x: newPiece.position.x + 1 } });
    }
  }, [board, currentPiece, gameOver, isPaused]);

  const hardDrop = useCallback(() => {
    if (gameOver || isPaused) return;
    let droppedPiece = { ...currentPiece };
    let droppedY = currentPiece.position.y;
    
    while (!checkCollision(board, { ...droppedPiece, position: { ...droppedPiece.position, y: droppedY + 1 } })) {
      droppedY++;
    }
    
    // Update score for hard drop (2 points per cell)
    const distance = droppedY - currentPiece.position.y;
    setScore(prev => prev + distance * 2);
    
    setCurrentPiece({ ...droppedPiece, position: { ...droppedPiece.position, y: droppedY } });
    // Force immediate lock in next tick or manually call lock here. 
    // Ideally, we set state and call lock, but lock depends on state.
    // Let's manually update state then lock in a robust way.
    // Actually, simplest is to commit to board immediately.
    const palette = PALETTES[initialSettings.colorPalette];
    const color = palette[currentPiece.type];
    const newBoard = mergePieceToBoard(board, { ...droppedPiece, position: { ...droppedPiece.position, y: droppedY } }, color);
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

     // Scoring duplication (refactor in future)
    if (linesCleared > 0) {
      const basePoints = [0, 100, 300, 500, 800]; 
      const comboBonus = comboCount * 50 * level;
      const points = basePoints[linesCleared] * level + comboBonus;
      setScore((prev) => prev + points);
      setRowsCleared((prev) => prev + linesCleared);
      setLevel((prev) => Math.floor((rowsCleared + linesCleared) / 10) + 1);
      setComboCount((prev) => prev + 1);
    } else {
      setComboCount(0);
    }
    setBoard(clearedBoard);
    spawnPiece();

  }, [board, currentPiece, gameOver, isPaused, initialSettings.colorPalette, comboCount, level, rowsCleared, spawnPiece]);

  const hold = useCallback(() => {
    if (gameOver || isPaused || holdUsed) return;
    
    const currentType = currentPiece.type;
    const nextType = heldPiece || nextQueue[0];
    
    setHeldPiece(currentType);
    setHoldUsed(true);
    
    if (heldPiece) {
      setCurrentPiece({ type: heldPiece, position: { x: 3, y: 0 }, rotation: 0 });
    } else {
      // If no hold, grab from queue
      const newQueue = [...nextQueue.slice(1), getRandomTetrominoType()];
      setNextQueue(newQueue);
      setCurrentPiece({ type: nextQueue[0], position: { x: 3, y: 0 }, rotation: 0 });
    }
  }, [currentPiece, heldPiece, holdUsed, nextQueue, gameOver, isPaused]);

  const pauseGame = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Game Loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    const tick = () => {
      move(0, 1);
      const now = Date.now();
      const delta = now - lastTickTime.current;
      lastTickTime.current = now;
      setTotalActivePlayTimeMs(prev => prev + delta);
    };

    const interval = setInterval(tick, getSpeed());
    return () => clearInterval(interval);
  }, [gameOver, isPaused, getSpeed, move]);

  // Persist State on Unmount or Pause
  useEffect(() => {
    if (gameOver) return;
    
    const state: SavedGameState = {
      board,
      currentPiece,
      nextQueue,
      heldPiece,
      holdUsed,
      score,
      level,
      rowsCleared,
      comboCount,
      speedMultiplier: 1, // derived
      startedAt,
      totalActivePlayTimeMs,
      difficulty: initialSettings.difficulty,
      settingsSnapshot: initialSettings,
    };
    saveGameState(state);
  }, [board, currentPiece, nextQueue, heldPiece, holdUsed, score, level, rowsCleared, comboCount, startedAt, totalActivePlayTimeMs, initialSettings, gameOver]);

  // Save stats on Game Over
  useEffect(() => {
    if (gameOver) {
      loadStats().then(stats => {
        const newStats: GameStats = {
            totalGamesPlayed: stats.totalGamesPlayed + 1,
            bestScore: Math.max(stats.bestScore, score),
            bestLevel: Math.max(stats.bestLevel, level),
            mostRowsCleared: Math.max(stats.mostRowsCleared, rowsCleared),
            bestCombo: Math.max(stats.bestCombo, comboCount), // assuming max combo in this game, tracking max ever
            totalScore: stats.totalScore + score,
            totalPlayTimeMs: stats.totalPlayTimeMs + totalActivePlayTimeMs
        };
        saveStats(newStats);
      });
    }
  }, [gameOver]);

  return {
    board,
    currentPiece,
    nextQueue,
    heldPiece,
    score,
    level,
    rowsCleared,
    gameOver,
    isPaused,
    actions: {
      moveLeft: () => move(-1, 0),
      moveRight: () => move(1, 0),
      moveDown: () => move(0, 1),
      rotate,
      hardDrop,
      hold,
      pauseGame,
    },
  };
}
