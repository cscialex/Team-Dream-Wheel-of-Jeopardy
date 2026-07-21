import type { Cell } from "../../../../types/wheelGame";
import styles from "./QuestionBoard.module.css";

export interface QuestionBoardProps {
	categories: string[];
	values: number[];
	board: Cell[][];
	activeCategory: number | null;
	pickingCategory: boolean;
	answering: boolean; 
	hasUnanswered: (catIdx: number) => boolean;
	onSelectCategory: (catIdx: number) => void;
	onSelectCell: (catIdx: number, rowIdx: number) => void;
}

export function QuestionBoard({
	categories,
	values,
	board,
	activeCategory,
	pickingCategory,
	answering,
	hasUnanswered,
	onSelectCategory,
	onSelectCell,
}: QuestionBoardProps) {
	return (
		<div className={styles.boardWrapper}>
			<div className={styles.grid}>
				{categories.map((name, catIdx) => {
                    // Category is clickable if the wheel has landed on a player/opponent choice
                    // and it has unanswered questions (any cell without answered flag set to true)
					const clickable = pickingCategory && hasUnanswered(catIdx);
					const isActive = activeCategory === catIdx;

                    // category button
					return (
						<button
							key={name}
							className={`${styles.categoryHeader} ${clickable ? styles.clickable : ""} ${isActive ? styles.active : ""}`}
							disabled={!clickable}
							onClick={() => onSelectCategory(catIdx)}
						>
							{name}
						</button>
					);
				})}

                {/* Each category cell */}
				{values.map((value, row) =>
					categories.map((_, catIdx) => {

						const cell = board[catIdx][row];
						const clickable = answering && activeCategory === catIdx && !cell.answered;

						return (
							<button
								key={`${catIdx}-${row}`}
								className={`${styles.cell} ${cell.answered ? styles.answered : ""} ${clickable ? styles.clickable : ""}`}
								disabled={!clickable}
								onClick={() => onSelectCell(catIdx, row)}
							>
								{cell.answered ? "" : `$${value}`}
							</button>
						);
					})
				)}
			</div>
		</div>
	);
}
