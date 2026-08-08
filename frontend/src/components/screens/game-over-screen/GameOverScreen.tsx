import useGameStore from "../../../store/gameStore";
import RoundResults from "../game-screen/round-results/RoundResults";
import Confetti from 'react-confetti'
import { useWindowSize } from "@uidotdev/usehooks";
import Button from "@mui/material/Button";


export default function GameOverScreen() {
    const players = useGameStore((s) => s.players);
    const { width, height } = useWindowSize();


    const topScore = Math.max(...players.map((p) => p.score));
    const winners = players
        .filter((p) => p.score === topScore)
        .map((p) => p.name)
        .join(", ");

    const handlePlayAgain = () => {
        // Should have a play again wiring in the backend
    }

    const buttonFooter = (
        <Button onClick={handlePlayAgain}>
            Play Again?
        </Button>
    )

    return (
        <>
            <Confetti width={width ?? undefined} height={height ?? undefined} />
            <RoundResults title={`Game Over! ${winners} wins!`} footer={buttonFooter} />
        </>
    );
}
