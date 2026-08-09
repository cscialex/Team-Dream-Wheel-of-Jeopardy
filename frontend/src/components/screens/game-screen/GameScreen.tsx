import styles from "./GameScreen.module.css";
import {
  valuesForRound,
  CATEGORIES,
  SECTORS,
} from "../../../types/wheelOfJeopardy";

import { QuestionBoard } from "./question-board/QuestionBoard";
import WheelComponent from "./wheel-component/WheelComponent";
import TopBar from "../../top-bar/TopBar";
import useGameStore from "../../../store/gameStore";
import { Backdrop, Card, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import RoundResults from "./round-results/RoundResults";

export function GameScreen() {
    const players = useGameStore((s) => s.players);
    const currPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
    const currPlayer = players[currPlayerIndex];

    const announcer = useGameStore((s) => s.announcer);
    const round = useGameStore((s) => s.round);
    const spinsRemaining = useGameStore((s) => s.spinsRemaining);
    const board = useGameStore((s) => s.board);
    const activeCategory = useGameStore((s) => s.activeCategory);
    const awaiting = useGameStore((s) => s.awaiting);
    const currentQuestion = useGameStore((s) => s.currentQuestion);
    const tokenRedemption = useGameStore((s) => s.tokenRedemption);
    const socketId = useGameStore((s) => s.socketId);
    const isCurrentPlayer = currPlayer?.socketId == socketId;
    const isMyTurn =
        awaiting === "oppCategorySelect" ? !isCurrentPlayer : isCurrentPlayer;

    const handleSelectCategory = useGameStore((s) => s.selectCategory);
    const handleSelectCell = useGameStore((s) => s.selectCell);
    const handleSelectAnswer = useGameStore((s) => s.selectAnswer);
    const handleTokenRedemption = useGameStore((s) => s.redeemToken);
    const tokenText = "Would you like to redeem a token?";
    const yesNo = ["Yes", "No"];

    const values = valuesForRound(round);

    // checking if a category in the board has some unanswered question
    const hasUnanswered = (category: number): boolean =>
        board[category]?.some((cell) => !cell.answered) ?? false;

    const prevRound = useRef(round);
    const [showScoreboard, setShowScoreboard] = useState(false);

    useEffect(() => {
        if (prevRound.current === 1 && round === 2) setShowScoreboard(true);
        else if (prevRound.current !== round) setShowScoreboard(false);
        prevRound.current = round;
    }, [round]);

    return (
        <div className={styles.layout}>
        {showScoreboard ? (
            <RoundResults onAdvance={() => setShowScoreboard(false)} mode={"roundResults"} />
        ) : (
            <div className={styles.gameContent}>
            {/* Backdrop to disable player actions */}
            <Backdrop
                open={!isMyTurn}
                sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
            >
                <Card className={styles.overlayCard}>
                <Typography variant="h5">
                    Waiting for {currPlayer?.name ?? "player"}{" "}
                    <span className={styles.dots} />{" "}
                </Typography>
                </Card>
            </Backdrop>

            <TopBar
                announcerText={announcer}
                players={players}
                currentRound={round}
                spinsLeft={spinsRemaining}
            />

            <div className={styles.mainRow}>
                <WheelComponent sectors={SECTORS} canSpin={isMyTurn} />

                <QuestionBoard
                categories={CATEGORIES}
                values={values}
                board={board}
                activeCategory={activeCategory}
                pickingCategory={
                    awaiting === "categorySelect" ||
                    awaiting === "oppCategorySelect"
                }
                pickingQuestion={awaiting === "questionSelect"}
                questionText={currentQuestion?.questionText ?? ""}
                tokenText={tokenText}
                yesNo={yesNo}
                tokenRedemption={tokenRedemption}
                answers={currentQuestion?.answers ?? []}
                answering={awaiting === "answerSelect"}
                hasUnanswered={hasUnanswered}
                onSelectCategory={handleSelectCategory}
                onSelectCell={handleSelectCell}
                onSelectAnswer={handleSelectAnswer}
                onTokenRedemption={handleTokenRedemption}
                />
            </div>
            </div>
        )}
        </div>
    );
}
