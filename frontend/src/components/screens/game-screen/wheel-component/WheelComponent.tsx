import styles from "./WheelComponent.module.css";
import type { Sector } from "../../../../types/wheelOfJeopardy";
import { useMemo, useRef, useState } from "react";
import { arc } from "d3-shape";
import Button from "@mui/material/Button";
import useGameStore from "../../../../store/gameStore";
import gameSocket from "../../../../gameSocket";

const SPIN_DURATION_MS = 4000;
const NUM_SPINS = 4;

export type WheelComponentProps = {
  sectors: Sector[];
  canSpin: boolean;
};

export default function WheelComponent({
  sectors,
  canSpin,
}: WheelComponentProps) {
  const isSpinning = useGameStore((s) => s.isSpinning);
  const awaitingSpin = useGameStore((s) => s.awaiting === "spin");

  const [rotation, setRotation] = useState<number>(0);
  const sectorSize = 360 / sectors.length;
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // svg settings
  const viewboxSize = 250;
  const wheelCenter = viewboxSize / 2;
  const pathGenerator = arc()
    .innerRadius(0)
    .outerRadius(wheelCenter - 10);

  function createArcPath(startAngle: number, endAngle: number) {
    const toRadians = (numDegrees: number) => (numDegrees * Math.PI) / 180;

    return pathGenerator({
      innerRadius: 0,
      outerRadius: wheelCenter - 10,
      startAngle: toRadians(startAngle),
      endAngle: toRadians(endAngle),
    });
  }

  // Pass a copy of the sectors into the shuffle so we dont modify in place
  // with the Fisher Yates algorithm
  const wheelSectors = useMemo(() => {
    return shuffle([...sectors]);
  }, [sectors]);

  const handleSpin = () => {
    if (isSpinning || !canSpin) return;

    gameSocket.emit("spin");

    // The backend will resolve the sector
    // setIsSpinning(true);

    // const randomOffset = Math.random() * 360;
    // const sectorTargetRotation = rotation + NUM_SPINS * 360 + randomOffset;

    // setRotation(sectorTargetRotation);

    // spinTimeoutRef.current = setTimeout(() => {
    //   // Strip the target rotation of the additional 360s from NumSpins
    //   const normalizedAngle = ((sectorTargetRotation % 360) + 360) % 360;
    //   const pointerAngle = (360 - normalizedAngle + 360) % 360;
    //   const landedIndex =
    //     Math.floor(pointerAngle / sectorSize) % wheelSectors.length;
    //   const landedSector = wheelSectors[landedIndex];

    //   setSpinResult(landedSector);
    //   setIsSpinning(false);
    // }, SPIN_DURATION_MS);
  };

  //   Cleanup for the spin timeout ref
  // useEffect(() => {
  //   return () => {
  //     if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
  //   };
  // }, []);

  return (
    <div className={styles.layout}>
      <div className={styles.trianglePointer} />

      <svg
        viewBox={`0 0 ${viewboxSize} ${viewboxSize}`}
        className={styles.wheelWrapper}
      >
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${wheelCenter}px ${wheelCenter}px`,
            transition: `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.24, 0.99)`,
          }}
        >
          <g transform={`translate(${wheelCenter}, ${wheelCenter})`}>
            {wheelSectors.map((sector, i) => {
              const startAngle = i * sectorSize;
              const endAngle = (i + 1) * sectorSize;

              return (
                <g key={i}>
                  <path
                    d={createArcPath(startAngle, endAngle)}
                    fill={sector.color}
                  />

                  <foreignObject
                    x={-50}
                    y={-(wheelCenter - 40)}
                    width={100}
                    height={50}
                    transform={`rotate(${startAngle + sectorSize / 2})`}
                  >
                    <div className={styles.sectorLabel}>{sector.label}</div>
                  </foreignObject>
                </g>
              );
            })}

            <circle
              r={wheelCenter - 10}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth={6}
            />
          </g>
        </g>
      </svg>

      <div className={styles.buttonWrapper}>
        <Button
          className={styles.spinButton}
          disabled={isSpinning || !canSpin || !awaitingSpin}
          onClick={handleSpin}
        >
          {isSpinning ? "Spinning..." : "Spin"}
        </Button>
      </div>
    </div>
  );
}

function shuffle(sectors: Sector[]) {
  // Implementation of the fisher yates algorithm for shuffling the sectors
  for (let i = sectors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [sectors[i], sectors[j]] = [sectors[j], sectors[i]];
  }
  return sectors;
}
