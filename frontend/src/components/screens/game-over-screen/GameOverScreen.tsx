import useGameStore from "../../../store/gameStore";
import RoundResults from "../game-screen/round-results/RoundResults";
import Confetti from 'react-confetti'
import { useWindowSize } from "@uidotdev/usehooks";
import Button from "@mui/material/Button";


export default function GameOverScreen() {
    const players = useGameStore((s) => s.players);
    const { width, height } = useWindowSize();
    const handlePlayAgain = useGameStore((s) => s.playAgain);

    const topScore = Math.max(...players.map((p) => p.scoreRound1 + p.scoreRound2));
    const winners = players
        .filter((p) => (p.scoreRound1 + p.scoreRound2) === topScore)
        .map((p) => p.name)
        .join(", ");

    const buttonFooter = (
        <Button onClick={handlePlayAgain}>
            Play Again?
        </Button>
    )

    return (
        <>
            <Confetti width={width ?? undefined} height={height ?? undefined} />
            <RoundResults mode={"gameOver"} title={`Game Over! ${winners} wins!`} footer={buttonFooter} />
        </>
    );
}
