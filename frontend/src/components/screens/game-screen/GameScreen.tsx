import styles from "./GameScreen.module.css";
import {
  valuesForRound,
  CATEGORIES,
  SECTORS,
} from "../../../types/wheelOfJeopardy";

import { QuestionBoard } from "./question-board/QuestionBoard";
import WheelComponent from "./wheel-component/WheelComponent";
import TopBar from "../../top-bar/TopBar";
import useGameStore from "../../../store/gameStore";

export function GameScreen() {
  const players = useGameStore((s) => s.players);
  const announcer = useGameStore((s) => s.announcer);
  const round = useGameStore((s) => s.round);
  const spinsRemaining = useGameStore((s) => s.spinsRemaining);
  const board = useGameStore((s) => s.board);
  const activeCategory = useGameStore((s) => s.activeCategory);

  const handleSelectCategory = useGameStore((s) => s.selectCategory);
  const handleSelectCell = useGameStore((s) => s.selectCell);

  const values = valuesForRound(round);

  // checking if a category in the board has some unanswered question
  const hasUnanswered = (category: number): boolean =>
    board[category]?.some((cell) => !cell.answered) ?? false;

  return (
    <div className={styles.layout}>
      <TopBar
        announcerText={announcer}
        players={players}
        currentRound={round}
        spinsLeft={spinsRemaining}
      />

      <div className={styles.mainRow}>
        <WheelComponent sectors={SECTORS} canSpin />

        <QuestionBoard
          categories={CATEGORIES}
          values={values}
          board={board}
          activeCategory={activeCategory}
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
