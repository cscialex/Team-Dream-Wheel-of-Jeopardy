import { Button } from "@mui/material";
import styles from "./WheelComponent.module.css";
import type { Sector } from "../../../../types/wheelGame";

export type WheelComponentProps = {
    sectors: Sector[];
    isSpinning: boolean;
    canSpin: boolean;
    onSpin: () => void;
}

export default function WheelComponent({sectors, isSpinning, canSpin, onSpin}: WheelComponentProps) {
    return (
        <div>

            <div className={styles.wheelWrapper}>
                <div className={styles.wheel}>
                    {sectors.map((sector, idx) => {
                        return (
                            <div key={idx} className={styles.wheelLabel}>
                                {sector.label}
                            </div>
                        );
                    })}
                </div>
            </div>

            <Button onClick={onSpin} disabled={!canSpin}>
                {isSpinning ? "Spinning..." : "Spin the Wheel"}
            </Button>
        </div>
    )
}