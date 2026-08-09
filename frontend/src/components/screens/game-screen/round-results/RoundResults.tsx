import type { ReactNode } from "react";
import Typography from "@mui/material/Typography";
import useGameStore from "../../../../store/gameStore";
import type { Player } from "../../../../types/wheelOfJeopardy";
import styles from "./RoundResults.module.css";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";

type PlayerListEntryProps = {
    score: number
    player: Player;
    isLeader: boolean;
};

function PlayerListEntry({ score, player, isLeader }: PlayerListEntryProps) {
    return (
        <div className={`${styles.playerEntry} ${isLeader ? styles.leader : ""}`}>
            <Typography>
                {player.name}
            </Typography>
            <Typography>
                ${score}
            </Typography>
            <Typography className={styles.iconWithValue}>
                <LocalActivityIcon
                    fontSize="small"
                    sx={{
                        color: "var(--color-gold)",
                    }}
                />
                {player.tokens}
            </Typography>
        </div>
    );
}

type RoundResultsProps = {
    mode: "roundResults" | "gameOver";
    title?: string;
    footer?: ReactNode;
    onAdvance?: () => void;
};

// Round results, each player listed with their scores and token amounts
export default function RoundResults({ mode = "roundResults", title, footer, onAdvance }: RoundResultsProps) {
    const players = useGameStore((s) => s.players);
    const round = useGameStore((s) => s.round);
    const prevRound = round - 1;

    const getScore = (p: Player) => {
        if (mode === "gameOver") {
            return p.scoreRound1 + p.scoreRound2;
        }
        else {
            if (prevRound === 1) return p.scoreRound1;
            return p.scoreRound2;
        }
    }

    // Have to spread the players array as to not mutate the original
    const sortedPlayers = [...players].sort((p1, p2) => getScore(p2) - getScore(p1));

    const topScore = Math.max(...players.map((p) => getScore(p)));

    return (
        <div className={styles.rays}>
            <div className={styles.pageHeader}>
                <Typography variant="h5" style={{ fontFamily: "var(--font-jeopardy)" }}>
                {title ?? `Round ${round - 1} Results`}
                </Typography>
            </div>

            <Card className={styles.scoreboardCard}>
                <div className={styles.scoreboardHeader}>
                    <Typography variant="subtitle2"><b>Player</b></Typography>
                    <Typography variant="subtitle2"><b>Score</b></Typography>
                    <Typography variant="subtitle2"><b>Tokens</b></Typography>
                </div>

                {/* List of players and their scores */}
                {sortedPlayers.map((p, idx) => (
                    <PlayerListEntry key={idx} score={getScore(p)} player={p} isLeader={topScore === getScore(p)} />
                ))}

                {footer === undefined ? <Button onClick={onAdvance}>Next Round</Button> : footer}
            </Card>
        </div>
    );
}
