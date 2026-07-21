import { useState } from "react";
import Typography from "@mui/material/Typography";

import styles from "./GameScreen.module.css";
import {
  type Player,
  type Cell,
  makeBoard,
  valuesForRound,
  CATEGORIES,
  SECTORS,
} from "../../../types/wheelGame";

import { QuestionBoard } from "./question-board/QuestionBoard";
import WheelComponent from "./wheel-component/WheelComponent";
import TopBar from "../../top-bar/TopBar";

export type GameScreenProps = {
  playerCount?: 2 | 3 | 4;
  spinsPerRound?: number;
}

type GameState = {
  players: Player[];
  currentPlayerIndex: number;
  round: 1 | 2;
  spinsRemaining: number;
  board: Cell[][];
  activeCategory: number | null;
  announcer: "";
}

function initialState(
  playerCount: number,
  spinsPerRound: number,
): GameState {
  return {
    players: Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      name: `Player ${i + 1}`,
      score: 0,
      tokens: 0,
    })),
    currentPlayerIndex: 0,
    round: 1,
    spinsRemaining: spinsPerRound,
    board: makeBoard(valuesForRound(1)),
    activeCategory: null,
    announcer: ""
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
      <TopBar announcerText={state.announcer} players={state.players} currentRound={state.round} spinsLeft={state.spinsRemaining} />

      <div className={styles.mainRow}>
        <WheelComponent
          sectors={SECTORS}
          canSpin
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