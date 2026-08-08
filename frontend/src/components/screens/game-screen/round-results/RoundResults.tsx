import type { ReactNode } from "react";
import Typography from "@mui/material/Typography";
import useGameStore from "../../../../store/gameStore";
import type { Player } from "../../../../types/wheelOfJeopardy";
import styles from "./RoundResults.module.css";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";

type PlayerListEntryProps = {
  player: Player;
  isLeader: boolean;
};

function PlayerListEntry({ player, isLeader }: PlayerListEntryProps) {
  return (
    <div className={`${styles.playerEntry} ${isLeader ? styles.leader : ""}`}>
        <Typography>
            {player.name}
        </Typography>
        <Typography>
            ${player.score}
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
    title?: string;
    footer?: ReactNode;
};

// Round results, each player listed with their scores and token amounts
export default function RoundResults({ title, footer }: RoundResultsProps) {
    const players = useGameStore((s) => s.players);
    const round = useGameStore((s) => s.round);
    const advanceRound = useGameStore((s) => s.advanceRound);

    // Have to spread the players array as to not mutate the original
    const sortedPlayers = [...players].sort((p1, p2) => p1.score - p2.score)
    const topScore = Math.max(...players.map((p) => p.score));

    return (
        <div className={styles.rays}>
            <div className={styles.pageHeader}>
                <Typography variant="h5" style={{ fontFamily: "var(--font-jeopardy)" }}>
                {title ?? `Round ${round} Results`}
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
                    <PlayerListEntry key={idx} player={p} isLeader={topScore === p.score} />
                ))}

                {footer === undefined ? <Button onClick={advanceRound}>Next Round</Button> : footer}
            </Card>
        </div>
    );
}
