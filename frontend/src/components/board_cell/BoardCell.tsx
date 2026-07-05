import { useState } from "react";
import styles from "./BoardCell.module.css";

type BoardCellProps = {
    category: string;
    points: number;
    handleClick: (category: string, points: number) => void;
}

// Each cell has reference to its own category and point value
export function BoardCell({ category, points, handleClick}: BoardCellProps) {
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    
    const onClickHandler = () => {
        setIsAnswered(true);
        handleClick(category, points);
    }

    return (
        <td className={isAnswered ? `${styles.cell} ${styles.cellAnswered}` : styles.cell} onClick={() => onClickHandler()}>{points}</td>
    )
}