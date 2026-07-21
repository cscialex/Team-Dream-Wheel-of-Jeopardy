import { useState } from "react";
import Typography from "@mui/material/Typography";

import styles from "./GameScreen.module.css";
import {
  type WheelPlayer,
  type Cell,
  makeBoard,
  valuesForRound,
  CATEGORIES,
  SECTORS,
} from "../../../types/wheelGame";

import { QuestionBoard } from "./question-board/QuestionBoard";
import WheelComponent from "./wheel-component/WheelComponent";

export type GameScreenProps = {
  playerCount?: 2 | 3 | 4;
  spinsPerRound?: number;
}

type GameState = {
  players: WheelPlayer[];
  currentPlayerIndex: number;
  round: 1 | 2;
  spinsRemaining: number;
  board: Cell[][];
  activeCategory: number | null;
}

function initialState(
  playerCount: number,
  spinsPerRound: number,
): GameState {
  return {
    players: Array.from({ length: playerCount }, (_, i) => ({
      name: `Player ${i + 1}`,
      score: 0,
      tokens: 0,
    })),
    currentPlayerIndex: 0,
    round: 1,
    spinsRemaining: spinsPerRound,
    board: makeBoard(valuesForRound(1)),
    activeCategory: null,
  };
}

export function GameScreen({
  playerCount = 2,
  spinsPerRound = 30,
}: GameScreenProps) {
  const [state, setState] = useState(() =>
    initialState(playerCount, spinsPerRound),
  );

  const values = valuesForRound(state.round);

// checking if a category in the board has some unanswered question
  const hasUnanswered = (category: number): boolean =>
    state.board[category].some((cell) => !cell.answered);

  const handleSpin = () => {
    console.log("TODO: Spin");
  };

  const handleSelectCategory = (category: number) => {
    console.log("TODO: Category", category);

    setState((s) => ({
      ...s,
      activeCategory: category,
    }));
  };

  const handleSelectCell = (category: number, row: number) => {
    console.log("TODO: Cell", category, row);
  };

  return (
    <div className={styles.layout}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Typography>Round {state.round}</Typography>
          <Typography>Spins Left: {state.spinsRemaining}</Typography>
        </div>

        <div className={styles.scoreboard}>
          {state.players.map((player) => (
            <div key={player.name}>
              <Typography>{player.name}</Typography>
              <Typography>Score: {player.score}</Typography>
              <Typography>Tokens: {player.tokens}</Typography>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.mainRow}>
        <WheelComponent
          sectors={SECTORS}
          canSpin
          isSpinning={false}
          onSpin={handleSpin}
        />

        <QuestionBoard
          categories={CATEGORIES}
          values={values}
          board={state.board}
          activeCategory={state.activeCategory}
          pickingCategory={false}
          answering={false}
          hasUnanswered={hasUnanswered}
          onSelectCategory={handleSelectCategory}
          onSelectCell={handleSelectCell}
        />
      </div>
    </div>
  );
}