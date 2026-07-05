import { BoardCell } from "../board_cell/BoardCell";
import styles from "./Board.module.css";

// Some categories and points for us to start with
const CATEGORY_NAMES = ["Sports", "History", "Pop Culture"]
const POINT_VALUES = [200, 400, 600, 800, 1000]

export default function BoardStub() {

    const handleClick = (category: string, points: number) => {
        // Grab a question with the corresponding category and points from the database
        console.log(`Requesting a question for category: ${category} with points: ${points}`);
        return;
    }

    return (
        <table className={styles.board}>
            <thead>
                <tr>
                    {CATEGORY_NAMES.map((cat, idx) => (
                        <th key={idx} className={styles.categoryHeader}>{cat}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {POINT_VALUES.map((points, rowIdx) => (
                    <tr key={rowIdx}>
                        {CATEGORY_NAMES.map((cat, catIdx) => (
                            <BoardCell
                                key={`${rowIdx}-${catIdx}`}
                                category={cat}
                                points={points}
                                handleClick={handleClick}
                            />
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}