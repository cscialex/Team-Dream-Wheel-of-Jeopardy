import { Typography } from "@mui/material";
import styles from "./TopBar.module.css";
import type { Player } from "../../types/wheelOfJeopardy";
import Chip from "@mui/material/Chip";

type TopBarProps = {
  announcerText: string;
  players: Player[];
  currentRound: number;
  spinsLeft: number;
};

export default function TopBar({
  announcerText,
  players,
  currentRound,
  spinsLeft,
}: TopBarProps) {
    return (
        <div className={styles.topBar}>
            <div className={styles.roundBadge}>
                <Typography variant="overline">Round {currentRound}</Typography>
            </div>
            <Chip
                label={`Spins Left: ${spinsLeft}`}
                className={styles.spinsLeftChip}
                size="small"
            />
            <div className={styles.wrapper}>
                <div className={styles.playerColumn}>
                    {players.map((player) => (
                        <div className={styles.playerRow} key={player.id}>
                        <Typography variant="body2" className={styles.playerName}>
                            <b>{player.name}</b>
                        </Typography>
                        <div className={styles.chipGroup}>
                            <Chip
                            label={`Score: ${player.score}`}
                            className={styles.scoreChip}
                            size="small"
                            />
                            <Chip
                            label={`Tokens: ${player.tokens}`}
                            className={styles.tokenChip}
                            size="small"
                            />
                        </div>
                        </div>
                    ))}
                </div>
            </div>

            {announcerText !== "" ? (
                <div className={styles.announcer}>
                    <Typography variant="overline" className={styles.announcerLabel}>
                        Announcer
                    </Typography>
                    <Typography variant="body1">{announcerText}</Typography>
                </div>
            ) : null}
        </div>
    );
}
