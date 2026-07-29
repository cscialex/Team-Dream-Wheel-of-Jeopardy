import type { Cell } from "../../../../types/wheelOfJeopardy";
import styles from "./QuestionBoard.module.css";

export interface QuestionBoardProps {
	categories: string[];
	values: number[];
	board: Cell[][];
	activeCategory: number | null;
	pickingCategory: boolean;
	pickingQuestion: boolean;
	questionText: string;
	tokenText: string;
	yesNo: string[];
	tokenRedemption: boolean;
	answers: {answerId: number; answerText: string}[];
	answering: boolean;
	hasUnanswered: (catIdx: number) => boolean;
	onSelectCategory: (catIdx: number) => void;
	onSelectCell: (catIdx: number, rowIdx: number) => void;
	onSelectAnswer: (answerId: number) => void;
	onTokenRedemption: (redeem: boolean) => void;
}

export function QuestionBoard({
	categories,
	values,
	board,
	activeCategory,
	pickingCategory,
	pickingQuestion,
	questionText,
	yesNo,
	tokenRedemption,
	tokenText,
	answers,
	answering,
	hasUnanswered,
	onSelectCategory,
	onSelectCell,
	onSelectAnswer,
	onTokenRedemption
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
						const clickable = pickingQuestion && activeCategory === catIdx && !cell.answered;

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
			{answers.length > 0 && (
				<div className={styles.ansWrapper}>
					<p className={styles.questionText}>{questionText}</p>
					<div className={styles.ansGrid}>
						{answers.map((answer) => (
							<button
								key={answer.answerId}
								className={styles.answer}
								onClick={() => onSelectAnswer(answer.answerId)}
							>
								{answer.answerText}
							</button>
						))}
					</div>
				</div>
			)}
			{tokenRedemption && 
				(<div className={styles.tokenWrapper}>
					<p className={styles.tokenText}>{tokenText}</p>
					<div className={styles.tokenGrid}>
						{yesNo.map((redeemOption) => (
							<button 
								key={redeemOption}
								className={styles.token}
								onClick={() => onTokenRedemption(true)}
							>
								{redeemOption}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
