import { useEffect, useState } from "react";
import styles from "./SetupScreen.module.css";
import useGameStore from "../../../store/gameStore";
import { Button, List, ListItem, TextField, Typography } from "@mui/material";


function GlowingHeader() {
    const [bulbCount, setBulbCount] = useState(25);

    useEffect(() => {
        function updateBulbRender() {
            const windowSize = window.innerWidth;

            if (windowSize < 1024) { // medium screen size, no phones
                setBulbCount(25);
            } else {
                setBulbCount(30);
            }
        }

        updateBulbRender();
        window.addEventListener("resize", updateBulbRender);
        return () => window.removeEventListener("resize", updateBulbRender);
    }, [])

    return (
        <div className={styles.glowHeader}>
            {Array.from({ length: bulbCount}).map((_, idx) => (
                <div key={idx} className={styles.bulb} />
            ))}
        </div>
    )
}

/**
 * Establish a game session
 * Join a game session
 * User name
 * 
 */
function SetupCard() {
    const [name, setName] = useState<string>("");
    const players = useGameStore((s) => s.players);
    const join = useGameStore((s) => s.join);
    const startGame = useGameStore((s) => s.startGame);
    const [hasJoined, setHasJoined] = useState<boolean>(false);


    const nameIsValid = name.trim().length > 0;
    const hasEnoughPlayers = players.length >= 2;

    const handleJoin = () => {
        join(name.trim()); // don't need extra spaces off the end of a name
        setHasJoined(true);
    }

    const handleStartGame = () => {
        startGame();
    }

    return (
        <div className={styles.card}>
            <Typography
                variant="h4"
                sx={{ 
                    fontFamily: "var(--font-jeopardy)", 
                    color: "var(--color-gold)",
                    textAlign: "center"
                }}>
                Join a Game
            </Typography>
            <TextField
                fullWidth
                variant="outlined"
                type="text" 
                label="Name" 
                value={name} 
                onChange={(event) => setName(event.target.value)}
                disabled={hasJoined}
            />
            <Button variant="outlined" onClick={handleJoin} disabled={!nameIsValid || hasJoined}>Join Game</Button>

            <List className={styles.playerList}>
                {players.map((p) => (
                    <ListItem key={p.id} divider>
                        {p.name}
                    </ListItem>
                ))}
            </List>

            <Button variant="contained" onClick={handleStartGame} disabled={!hasEnoughPlayers}>Start!</Button>
        </div>
    )
}


export default function SetupScreen() {


    return (
        <div className={styles.layout}>
            <GlowingHeader />

            <SetupCard />
        </div>
    )
}