import { ActionPanel, Action, Detail, Icon, useNavigation, showToast, Toast, Keyboard, Color } from "@raycast/api";
import { useEffect, useState, useCallback, useRef } from "react";
import { GameState, GameSettings } from "./types";
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
import { loadSettings, updateStatsWithRun, loadStats, loadAchievements } from "./storage";
import { checkAchievements, unlockAchievements, GameRunData } from "./achievements";

export default function Command() {
  const { pop } = useNavigation();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const gameEndedRef = useRef(false);

  useEffect(() => {
    async function initGame() {
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);
      const initialState = createInitialGameState(
        loadedSettings.difficulty,
        loadedSettings.colorPalette,
        loadedSettings.visualEffectsEnabled,
      );
      setGameState(initialState);
      setIsLoading(false);
    }
    initGame();
  }, []);

  const finalizeGame = useCallback(async (state: GameState) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;

    const playTime = state.activePlayTimeMs;
    await updateStatsWithRun(state.score, state.level, state.rowsCleared, playTime, state.difficulty, state.comboCount);

    const [previousStats, currentAchievements] = await Promise.all([loadStats(), loadAchievements()]);

    const pbMessages: string[] = [];
    if (state.score > previousStats.bestScore) pbMessages.push("Score");
    if (state.level > previousStats.bestLevel) pbMessages.push("Level");
    if (state.rowsCleared > previousStats.mostRowsCleared) pbMessages.push("Rows Cleared");
    if (state.comboCount > previousStats.bestCombo) pbMessages.push("Combo");

    if (pbMessages.length > 0) {
      await showToast({
        style: Toast.Style.Success,
        title: "New Personal Best!",
        message: pbMessages.join(", "),
      });
    }

    const runData: GameRunData = {
      score: state.score,
      level: state.level,
      rowsCleared: state.rowsCleared,
      difficulty: state.difficulty,
      comboCount: state.comboCount,
      tetrisCount: state.tetrisCount,
    };

    const newAchievements = checkAchievements(runData, currentAchievements);
    if (newAchievements.length > 0) {
      await unlockAchievements(newAchievements);
      const achievementNames = newAchievements.map((id) => id.replace(/_/g, " ")).join(", ");
      await showToast({
        style: Toast.Style.Success,
        title: "Achievement Unlocked!",
        message: achievementNames,
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (gameState && !gameState.isGameOver) {
        finalizeGame(gameState);
      }
    };
  }, [gameState, finalizeGame]);

  useEffect(() => {
    if (gameState?.lastLineClearName) {
      const timeout = setTimeout(() => {
        setGameState((prev) => (prev ? { ...prev, lastLineClearName: "" } : prev));
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.lastLineClearName]);

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
      let newTetrisCount = prevState.tetrisCount;
      let lineClearName = "";

      if (linesCleared > 0) {
        const comboForScore = newCombo > 0 ? newCombo : 1;
        newScore += calculateScore(linesCleared, prevState.level, false, 0, prevState.difficulty, comboForScore);
        newCombo += 1;
        newRowsCleared += linesCleared;
        lineClearName = getLineClearName(linesCleared);

        if (linesCleared === 4) {
          newTetrisCount += 1;
        }
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
        tetrisCount: newTetrisCount,
        activePlayTimeMs: newActiveTime,
        lastTickTime: now,
        lastLineClearName: lineClearName,
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

      let newCombo = prevState.comboCount;
      let newRowsCleared = prevState.rowsCleared;
      let newTetrisCount = prevState.tetrisCount;
      let lineClearName = "";

      const comboForScore = linesCleared > 0 && newCombo > 0 ? newCombo : 1;
      const newScore =
        prevState.score +
        calculateScore(linesCleared, prevState.level, true, dropDist, prevState.difficulty, comboForScore);

      if (linesCleared > 0) {
        newCombo += 1;
        newRowsCleared += linesCleared;
        lineClearName = getLineClearName(linesCleared);

        if (linesCleared === 4) {
          newTetrisCount += 1;
        }
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
        tetrisCount: newTetrisCount,
        lastLineClearName: lineClearName,
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

  if (isLoading || !gameState || !settings) {
    return <Detail isLoading={true} markdown="Loading game..." />;
  }

  const markdown = renderBoardAsMarkdown(gameState);

  const moveKeys = settings.controlMode === "arrowKeys" ? "Arrow Keys" : "WASD";
  const rotateKey = settings.controlMode === "arrowKeys" ? "Up Arrow" : "W";
  const downKey = settings.controlMode === "arrowKeys" ? "Down Arrow" : "S";
  const leftKey = settings.controlMode === "arrowKeys" ? "Left Arrow" : "A";
  const rightKey = settings.controlMode === "arrowKeys" ? "Right Arrow" : "D";

  const controlsHelp = `
### Controls
- ${moveKeys}: Move piece (${leftKey} / ${rightKey} / ${downKey})
- ${rotateKey}: Rotate
- ${settings.primaryKey}: Hard drop
- ${settings.secondaryKey}: Hold piece
- ${settings.pauseKey}: Pause/Resume
- Backspace: Return to menu
  `;

  const keyMap: Record<string, Keyboard.KeyEquivalent> = {
    E: "e",
    P: "p",
    R: "r",
    Space: "space",
    Q: "q",
    C: "c",
    F: "f",
    Tab: "tab",
  };

  const rotateKeyShortcut =
    settings.controlMode === "arrowKeys"
      ? { modifiers: [], key: "arrowUp" as Keyboard.KeyEquivalent }
      : { modifiers: [], key: "w" as Keyboard.KeyEquivalent };
  const downKeyShortcut =
    settings.controlMode === "arrowKeys"
      ? { modifiers: [], key: "arrowDown" as Keyboard.KeyEquivalent }
      : { modifiers: [], key: "s" as Keyboard.KeyEquivalent };
  const leftKeyShortcut =
    settings.controlMode === "arrowKeys"
      ? { modifiers: [], key: "arrowLeft" as Keyboard.KeyEquivalent }
      : { modifiers: [], key: "a" as Keyboard.KeyEquivalent };
  const rightKeyShortcut =
    settings.controlMode === "arrowKeys"
      ? { modifiers: [], key: "arrowRight" as Keyboard.KeyEquivalent }
      : { modifiers: [], key: "d" as Keyboard.KeyEquivalent };

  const pauseKeyShortcut = { modifiers: [], key: (keyMap[settings.pauseKey] || "e") as Keyboard.KeyEquivalent };
  const primaryKeyShortcut = { modifiers: [], key: (keyMap[settings.primaryKey] || "space") as Keyboard.KeyEquivalent };
  const secondaryKeyShortcut = { modifiers: [], key: (keyMap[settings.secondaryKey] || "c") as Keyboard.KeyEquivalent };

  return (
    <Detail
      markdown={markdown + "\n" + controlsHelp}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Score" text={{ value: gameState.score.toLocaleString(), color: Color.Blue }} />
          <Detail.Metadata.Label title="Level" text={gameState.level.toString()} />
          <Detail.Metadata.Label title="Rows" text={gameState.rowsCleared.toString()} />
          <Detail.Metadata.Label title="Combo" text={gameState.comboCount > 1 ? `${gameState.comboCount}x` : "—"} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Time" text={formatTime(gameState.activePlayTimeMs)} />
          <Detail.Metadata.TagList title="Difficulty">
            <Detail.Metadata.TagList.Item text={gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1)} color={"#eed535"} />
          </Detail.Metadata.TagList>
          <Detail.Metadata.Label
            title="Difficulty"
            text={gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1)}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Next Piece" text={renderPiecePreview(gameState.nextPiece)} />
          <Detail.Metadata.Label title="Held Piece" text={renderPiecePreview(gameState.heldPiece)} />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action title="Rotate" onAction={rotate} shortcut={rotateKeyShortcut} />
          <Action title="Move Down" onAction={() => movePiece(0, 1)} shortcut={downKeyShortcut} />
          <Action title="Move Left" onAction={() => movePiece(-1, 0)} shortcut={leftKeyShortcut} />
          <Action title="Move Right" onAction={() => movePiece(1, 0)} shortcut={rightKeyShortcut} />
          <Action title="Hard Drop" onAction={hardDrop} shortcut={primaryKeyShortcut} />
          <Action title="Hold Piece" onAction={hold} shortcut={secondaryKeyShortcut} />
          <Action title="Pause/Resume" onAction={togglePause} shortcut={pauseKeyShortcut} />
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
