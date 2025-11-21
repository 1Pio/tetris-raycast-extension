import { ActionPanel, Action, Detail, Icon, useNavigation } from "@raycast/api";
import { useEffect, useState, useCallback } from "react";
import { GameState } from "./types";
import {
  createInitialGameState,
  renderBoardAsMarkdown,
  renderPiecePreview,
  formatTime,
  rotatePiece,
  isValidPosition,
  lockPieceToBoard,
  clearLines,
  calculateScore,
  getTickInterval,
  calculateLevel,
  getDropDistance,
  getRandomTetromino,
  getLineClearName,
} from "./game-engine";
import { loadSettings, updateStatsWithRun } from "./storage";

export default function Command() {
  const { pop } = useNavigation();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastLineClear, setLastLineClear] = useState<string>("");

  useEffect(() => {
    async function initGame() {
      const settings = await loadSettings();
      const initialState = createInitialGameState(settings.difficulty, settings.colorPalette);
      setGameState(initialState);
      setIsLoading(false);
    }
    initGame();
  }, []);

  const finalizeGame = useCallback(async (state: GameState) => {
    const playTime = state.activePlayTimeMs;
    await updateStatsWithRun(state.score, state.level, state.rowsCleared, playTime, state.difficulty, state.comboCount);
  }, []);

  useEffect(() => {
    return () => {
      if (gameState && !gameState.isGameOver) {
        finalizeGame(gameState);
      }
    };
  }, [gameState, finalizeGame]);

  useEffect(() => {
    if (!gameState || gameState.isPaused || gameState.isGameOver) return;

    const interval = getTickInterval(gameState.level, gameState.difficulty);
    const timer = setTimeout(() => {
      tick();
    }, interval);

    return () => clearTimeout(timer);
  }, [gameState]);

  const tick = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState || prevState.isPaused || prevState.isGameOver) return prevState;

      const now = Date.now();
      const timeDelta = now - prevState.lastTickTime;
      const newActiveTime = prevState.activePlayTimeMs + timeDelta;

      if (!prevState.currentPiece) return prevState;

      const movedPiece = { ...prevState.currentPiece, y: prevState.currentPiece.y + 1 };

      if (isValidPosition(movedPiece, prevState.board)) {
        return {
          ...prevState,
          currentPiece: movedPiece,
          activePlayTimeMs: newActiveTime,
          lastTickTime: now,
        };
      }

      const newBoard = lockPieceToBoard(prevState.currentPiece, prevState.board);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

      let newScore = prevState.score;
      let newCombo = prevState.comboCount;
      let newRowsCleared = prevState.rowsCleared;

      if (linesCleared > 0) {
        newScore += calculateScore(linesCleared, prevState.level, false, 0);
        newCombo += linesCleared;
        newRowsCleared += linesCleared;
        setLastLineClear(getLineClearName(linesCleared));
        setTimeout(() => setLastLineClear(""), 2000);
      } else {
        newCombo = 0;
      }

      const newLevel = calculateLevel(newRowsCleared);
      const nextPiece = prevState.nextPiece || getRandomTetromino(prevState.colorPalette);
      const newNextPiece = getRandomTetromino(prevState.colorPalette);

      if (!isValidPosition(nextPiece, clearedBoard)) {
        finalizeGame({
          ...prevState,
          board: clearedBoard,
          currentPiece: null,
          isGameOver: true,
          activePlayTimeMs: newActiveTime,
        });

        return {
          ...prevState,
          board: clearedBoard,
          currentPiece: null,
          isGameOver: true,
          score: newScore,
          level: newLevel,
          rowsCleared: newRowsCleared,
          comboCount: newCombo,
          activePlayTimeMs: newActiveTime,
          lastTickTime: now,
        };
      }

      return {
        ...prevState,
        board: clearedBoard,
        currentPiece: nextPiece,
        nextPiece: newNextPiece,
        canHold: true,
        score: newScore,
        level: newLevel,
        rowsCleared: newRowsCleared,
        comboCount: newCombo,
        activePlayTimeMs: newActiveTime,
        lastTickTime: now,
      };
    });
  }, [finalizeGame]);

  const movePiece = useCallback((dx: number, dy: number) => {
    setGameState((prevState) => {
      if (!prevState || prevState.isPaused || prevState.isGameOver || !prevState.currentPiece) return prevState;

      const movedPiece = {
        ...prevState.currentPiece,
        x: prevState.currentPiece.x + dx,
        y: prevState.currentPiece.y + dy,
      };

      if (isValidPosition(movedPiece, prevState.board)) {
        return { ...prevState, currentPiece: movedPiece };
      }

      return prevState;
    });
  }, []);

  const rotate = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState || prevState.isPaused || prevState.isGameOver || !prevState.currentPiece) return prevState;

      const rotatedPiece = rotatePiece(prevState.currentPiece);

      if (isValidPosition(rotatedPiece, prevState.board)) {
        return { ...prevState, currentPiece: rotatedPiece };
      }

      return prevState;
    });
  }, []);

  const hardDrop = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState || prevState.isPaused || prevState.isGameOver || !prevState.currentPiece) return prevState;

      const dropDist = getDropDistance(prevState.currentPiece, prevState.board);
      const droppedPiece = { ...prevState.currentPiece, y: prevState.currentPiece.y + dropDist };

      const newBoard = lockPieceToBoard(droppedPiece, prevState.board);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

      const newScore = prevState.score + calculateScore(linesCleared, prevState.level, true, dropDist);
      let newCombo = prevState.comboCount;
      let newRowsCleared = prevState.rowsCleared;

      if (linesCleared > 0) {
        newCombo += linesCleared;
        newRowsCleared += linesCleared;
        setLastLineClear(getLineClearName(linesCleared));
        setTimeout(() => setLastLineClear(""), 2000);
      } else {
        newCombo = 0;
      }

      const newLevel = calculateLevel(newRowsCleared);
      const nextPiece = prevState.nextPiece || getRandomTetromino(prevState.colorPalette);
      const newNextPiece = getRandomTetromino(prevState.colorPalette);

      if (!isValidPosition(nextPiece, clearedBoard)) {
        finalizeGame({
          ...prevState,
          board: clearedBoard,
          currentPiece: null,
          isGameOver: true,
        });

        return {
          ...prevState,
          board: clearedBoard,
          currentPiece: null,
          isGameOver: true,
          score: newScore,
          level: newLevel,
          rowsCleared: newRowsCleared,
          comboCount: newCombo,
        };
      }

      return {
        ...prevState,
        board: clearedBoard,
        currentPiece: nextPiece,
        nextPiece: newNextPiece,
        canHold: true,
        score: newScore,
        level: newLevel,
        rowsCleared: newRowsCleared,
        comboCount: newCombo,
      };
    });
  }, [finalizeGame]);

  const hold = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState || prevState.isPaused || prevState.isGameOver || !prevState.currentPiece || !prevState.canHold)
        return prevState;

      if (!prevState.heldPiece) {
        const nextPiece = prevState.nextPiece || getRandomTetromino(prevState.colorPalette);
        const newNextPiece = getRandomTetromino(prevState.colorPalette);
        const heldPiece = { ...prevState.currentPiece, x: 3, y: 0, rotation: 0 };

        return {
          ...prevState,
          heldPiece,
          currentPiece: nextPiece,
          nextPiece: newNextPiece,
          canHold: false,
        };
      } else {
        const newCurrent = { ...prevState.heldPiece, x: 3, y: 0 };
        const newHeld = { ...prevState.currentPiece, x: 3, y: 0, rotation: 0 };

        return {
          ...prevState,
          currentPiece: newCurrent,
          heldPiece: newHeld,
          canHold: false,
        };
      }
    });
  }, []);

  const togglePause = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState || prevState.isGameOver) return prevState;

      const now = Date.now();
      if (!prevState.isPaused) {
        const timeDelta = now - prevState.lastTickTime;
        return {
          ...prevState,
          isPaused: true,
          activePlayTimeMs: prevState.activePlayTimeMs + timeDelta,
          lastTickTime: now,
        };
      } else {
        return {
          ...prevState,
          isPaused: false,
          lastTickTime: now,
        };
      }
    });
  }, []);

  if (isLoading || !gameState) {
    return <Detail isLoading={true} markdown="Loading game..." />;
  }

  const markdown = renderBoardAsMarkdown(gameState);
  const controlsHelp = `
### Controls
- Arrow Keys / WASD: Move piece
- Up Arrow / W: Rotate
- Space: Hard drop
- C: Hold piece
- E: Pause/Resume
- Backspace: Return to menu
${lastLineClear ? `\n**${lastLineClear}!**` : ""}
  `;

  return (
    <Detail
      markdown={markdown + "\n" + controlsHelp}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Score" text={gameState.score.toString()} />
          <Detail.Metadata.Label title="Level" text={gameState.level.toString()} />
          <Detail.Metadata.Label title="Rows" text={gameState.rowsCleared.toString()} />
          <Detail.Metadata.Label title="Combo" text={gameState.comboCount.toString()} />
          <Detail.Metadata.Label title="Time" text={formatTime(gameState.activePlayTimeMs)} />
          <Detail.Metadata.Label title="Difficulty" text={gameState.difficulty} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Next Piece" text={renderPiecePreview(gameState.nextPiece)} />
          <Detail.Metadata.Label title="Held Piece" text={renderPiecePreview(gameState.heldPiece)} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action title="Rotate" onAction={rotate} shortcut={{ modifiers: [], key: "arrowUp" }} />
          <Action title="Move Down" onAction={() => movePiece(0, 1)} shortcut={{ modifiers: [], key: "arrowDown" }} />
          <Action title="Move Left" onAction={() => movePiece(-1, 0)} shortcut={{ modifiers: [], key: "arrowLeft" }} />
          <Action title="Move Right" onAction={() => movePiece(1, 0)} shortcut={{ modifiers: [], key: "arrowRight" }} />
          <Action title="Hard Drop" onAction={hardDrop} shortcut={{ modifiers: [], key: "space" }} />
          <Action title="Hold Piece" onAction={hold} shortcut={{ modifiers: [], key: "c" }} />
          <Action title="Pause/Resume" onAction={togglePause} shortcut={{ modifiers: [], key: "e" }} />
          <Action
            title="Back to Menu"
            icon={Icon.ArrowLeft}
            onAction={pop}
            shortcut={{ modifiers: [], key: "delete" }}
          />
        </ActionPanel>
      }
    />
  );
}
