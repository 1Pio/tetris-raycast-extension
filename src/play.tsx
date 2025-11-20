import { ActionPanel, Action, Grid, Icon, Color, useNavigation, Detail, showToast, Toast } from "@raycast/api";
import { useEffect, useState, useMemo } from "react";
import { useTetrisGame } from "./hooks/useTetrisGame";
import { loadSettings, loadSavedGame } from "./storage";
import { GameSettings, SavedGameState } from "./types";
import { BOARD_HEIGHT, BOARD_WIDTH, PALETTES, TETROMINOES } from "./constants";
import { getTetrominoMatrix } from "./engine/game-logic";

interface PlayProps {
  resume?: boolean;
}

export default function PlayCommand({ resume = false }: PlayProps) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [initialState, setInitialState] = useState<SavedGameState | null>(null);

  useEffect(() => {
    async function prepare() {
      const s = await loadSettings();
      setSettings(s);
      if (resume) {
        const game = await loadSavedGame();
        if (game) {
          setInitialState(game);
        } else {
          await showToast({ style: Toast.Style.Failure, title: "No saved game found" });
        }
      }
      setIsLoading(false);
    }
    prepare();
  }, [resume]);

  if (isLoading || !settings) {
    return <Detail isLoading />;
  }

  return <GameView settings={settings} initialState={initialState} />;
}

function GameView({
  settings,
  initialState,
}: {
  settings: GameSettings;
  initialState: SavedGameState | null;
}) {
  const { pop } = useNavigation();

  // Game Hook
  const {
    board,
    currentPiece,
    nextQueue,
    heldPiece,
    score,
    level,
    rowsCleared,
    gameOver,
    isPaused,
    actions,
  } = useTetrisGame(settings, initialState, () => {
    showToast({ style: Toast.Style.Failure, title: "Game Over", message: "Press Backspace to exit" });
  });

  // Keyboard Shortcuts
  const controls = useMemo(() => {
    const mode = settings.controlMode;
    return {
      rotate: mode === "wasd" ? "w" : "ArrowUp",
      down: mode === "wasd" ? "s" : "ArrowDown",
      left: mode === "wasd" ? "a" : "ArrowLeft",
      right: mode === "wasd" ? "d" : "ArrowRight",
      // Map friendly names to actual Key values if needed, but Action shortcut props 
      // accept specific formats. We'll use standard modifiers for simplicity if needed,
      // but specific keys are best.
      // Raycast shortcuts are tricky; we can't bind raw arrows easily without modifiers in some contexts,
      // but `Action` shortcuts support them.
    };
  }, [settings]);

  // Flatten board for rendering
  // We also need to render the current piece ON TOP of the board for display
  const displayBoard = useMemo(() => {
    const display = board.map((row) => [...row]);
    const palette = PALETTES[settings.colorPalette];

    // Overlay current piece
    if (!gameOver) {
      const matrix = getTetrominoMatrix(currentPiece.type, currentPiece.rotation);
      const color = palette[currentPiece.type];
      
      // Optional: Ghost piece could go here (faint color)

      for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
          if (matrix[y][x] !== 0) {
            const boardX = currentPiece.position.x + x;
            const boardY = currentPiece.position.y + y;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              display[boardY][boardX] = color;
            }
          }
        }
      }
    }
    return display;
  }, [board, currentPiece, settings.colorPalette, gameOver]);

  // Convert board to Grid Items
  // 10 columns. 
  // To maintain aspect ratio, we rely on Raycast Grid layout.
  
  // We need to include Side Info in the Grid?
  // The prompt suggests: "The left area is the board. The right area contains stacked info".
  // If we use `Grid`, we can't easily split left/right with different widths.
  // `Grid` forces uniform columns.
  // Workaround: Use a wider grid (e.g. 14 columns). First 10 are board, last 4 are stats.
  
  const GRID_COLUMNS = 14; 
  const BOARD_COLS = 10;
  
  const gridItems = [];

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    // Board cells
    for (let x = 0; x < BOARD_COLS; x++) {
      const cellColor = displayBoard[y][x];
      gridItems.push(
        <Grid.Item
          key={`cell-${x}-${y}`}
          content={{ 
             // Using a solid color image or icon
             source: cellColor 
               ? { light: getBlockIcon(cellColor), dark: getBlockIcon(cellColor) } // Using a helper to generate SVG/Icon
               : Icon.Circle, // Empty placeholder
             tintColor: cellColor ? Color.PrimaryText : Color.SecondaryText // Fallback tint if needed
          }}
           // Use `source` with a generated color square
        />
      );
    }
    
    // Sidebar cells (4 cols per row)
    // We can map specific rows to specific stats
    // Row 0-3: Next Piece
    // Row 4: Score Label
    // Row 5: Score Value
    // Row 6: Level Label
    // Row 7: Level Value
    // etc.

    // Helper to create a sidebar item (Removed unused helper function warning)
    // const renderSidebarItem = (colIndex: number, content: any) => (
    //     <Grid.Item key={`sidebar-${y}-${colIndex}`} content={content} />
    // );

    // Just rendering empty or specific content based on Y
    // This is a bit hacky for a "UI", but fits the "All UI must be built with Raycast primitives" constraint 
    // while trying to achieve the layout.
    
    // Actually, `Grid` items flow left-to-right, top-to-bottom.
    // So we just push 10 board items, then 4 sidebar items, repeat 20 times.
    
    // Sidebar Logic
    // We have 4 columns of sidebar space per row.

    if (y === 1) {
       // "Next" Label
       gridItems.push(<Grid.Item key={`side-${y}-0`} content="NEXT" />);
       gridItems.push(<Grid.Item key={`side-${y}-1`} content="" />);
       gridItems.push(<Grid.Item key={`side-${y}-2`} content="" />);
       gridItems.push(<Grid.Item key={`side-${y}-3`} content="" />);
    } else if (y >= 2 && y <= 5) {
       // Next Piece Preview
       // 4x4 area effectively? 
       // We have 4 columns.
       // Let's render the next piece matrix here centered.
       const nextType = nextQueue[0];
       const matrix = TETROMINOES[nextType].matrix; // 3x3 or 4x4
       const palette = PALETTES[settings.colorPalette];
       const color = palette[nextType];
       
       const matrixRow = y - 2;
       for (let sx = 0; sx < 4; sx++) {
          let hasBlock = false;
          if (matrixRow < matrix.length && sx < matrix[matrixRow].length) {
             if (matrix[matrixRow][sx]) hasBlock = true;
          }
          gridItems.push(
            <Grid.Item 
                key={`side-${y}-${sx}`} 
                content={hasBlock ? { source: getBlockIcon(color) } : ""}
            />
          );
       }
    } else if (y === 7) {
        gridItems.push(<Grid.Item key={`side-${y}-0`} content="SCORE" />);
        gridItems.push(<Grid.Item key={`side-${y}-1`} content={score.toString()} />);
        gridItems.push(<Grid.Item key={`side-${y}-2`} content="" />);
        gridItems.push(<Grid.Item key={`side-${y}-3`} content="" />);
    } else if (y === 9) {
        gridItems.push(<Grid.Item key={`side-${y}-0`} content="LEVEL" />);
        gridItems.push(<Grid.Item key={`side-${y}-1`} content={level.toString()} />);
        gridItems.push(<Grid.Item key={`side-${y}-2`} content="" />);
        gridItems.push(<Grid.Item key={`side-${y}-3`} content="" />);
    } else if (y === 11) {
        gridItems.push(<Grid.Item key={`side-${y}-0`} content="ROWS" />);
        gridItems.push(<Grid.Item key={`side-${y}-1`} content={rowsCleared.toString()} />);
        gridItems.push(<Grid.Item key={`side-${y}-2`} content="" />);
        gridItems.push(<Grid.Item key={`side-${y}-3`} content="" />);
    } else if (y === 13) {
        gridItems.push(<Grid.Item key={`side-${y}-0`} content="HOLD" />);
        gridItems.push(<Grid.Item key={`side-${y}-1`} content={heldPiece || "None"} />);
        gridItems.push(<Grid.Item key={`side-${y}-2`} content="" />);
        gridItems.push(<Grid.Item key={`side-${y}-3`} content="" />);
    } else if (y === 15 && isPaused) {
        gridItems.push(<Grid.Item key={`side-${y}-0`} content="PAUSED" />);
        gridItems.push(<Grid.Item key={`side-${y}-1`} content="" />);
        gridItems.push(<Grid.Item key={`side-${y}-2`} content="" />);
        gridItems.push(<Grid.Item key={`side-${y}-3`} content="" />);
    } else {
       // Empty sidebar filler
       gridItems.push(<Grid.Item key={`side-${y}-0`} content="" />);
       gridItems.push(<Grid.Item key={`side-${y}-1`} content="" />);
       gridItems.push(<Grid.Item key={`side-${y}-2`} content="" />);
       gridItems.push(<Grid.Item key={`side-${y}-3`} content="" />);
    }
  }

  return (
    <Grid
      columns={GRID_COLUMNS}
      inset={Grid.Inset.Small}
      aspectRatio="1" // Square cells
      fit={Grid.Fit.Fill}
      searchBarPlaceholder="Focus here to play"
      navigationTitle={gameOver ? "Game Over" : isPaused ? "Paused" : `Lvl ${level} | Score ${score}`}
      actions={
        <ActionPanel>
            {/* Primary Actions */}
            <Action title="Hard Drop" icon={Icon.ArrowDown} shortcut={{ modifiers: [], key: settings.primaryKey === "Space" ? "space" : "return" }} onAction={actions.hardDrop} />
            <Action title="Hold" icon={Icon.Hand} shortcut={{ modifiers: [], key: "c" }} onAction={actions.hold} />
            <Action title="Pause" icon={Icon.Pause} shortcut={{ modifiers: [], key: "e" }} onAction={actions.pauseGame} />
            
            {/* Movement - mapped to user settings */}
            {/* Note: Raycast Action shortcuts are robust. We map all arrows to be safe. */}
            <Action title="Rotate" icon={Icon.RotateClockwise} shortcut={{ modifiers: [], key: "arrowUp" }} onAction={actions.rotate} />
            <Action title="Move Left" icon={Icon.ArrowLeft} shortcut={{ modifiers: [], key: "arrowLeft" }} onAction={actions.moveLeft} />
            <Action title="Move Right" icon={Icon.ArrowRight} shortcut={{ modifiers: [], key: "arrowRight" }} onAction={actions.moveRight} />
            <Action title="Soft Drop" icon={Icon.ArrowDown} shortcut={{ modifiers: [], key: "arrowDown" }} onAction={actions.moveDown} />

            {/* WASD Support mirrors */}
            <Action title="Rotate (W)" shortcut={{ modifiers: [], key: "w" }} onAction={actions.rotate} />
            <Action title="Left (A)" shortcut={{ modifiers: [], key: "a" }} onAction={actions.moveLeft} />
            <Action title="Right (D)" shortcut={{ modifiers: [], key: "d" }} onAction={actions.moveRight} />
            <Action title="Drop (S)" shortcut={{ modifiers: [], key: "s" }} onAction={actions.moveDown} />
            
            {/* Game Over / Exit */}
            {gameOver && <Action title="Back to Menu" onAction={pop} />}
        </ActionPanel>
      }
    >
      {gridItems}
    </Grid>
  );
}


// Helper to create a solid block icon URL or similar
// Since we can't use arbitrary HTML, we use Raycast Icons or data URIs if needed.
// `source` accepts a file path or URL or Icon.
// For a "solid color block", we can use `Icon.Circle` filled, or generate a tiny SVG data URI.
// Raycast supports data URIs for images.
function getBlockIcon(colorHex: string) {
  // Simple SVG rect
  const svg = `
  <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="${colorHex}" />
  </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
