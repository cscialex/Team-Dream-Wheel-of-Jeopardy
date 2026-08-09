export type SectorType =
  | "category"
  | "loseTurn"
  | "freeSpin"
  | "bankrupt"
  | "playersChoice"
  | "opponentsChoice";

export interface Sector {
	type: SectorType;
	label: string;
	color: string;
	catIndex?: number;
}

export interface Cell {
	answered: boolean;
}

export interface Player {
	id: number;
	name: string;
	scoreRound1: number;
	scoreRound2: number;
	tokens: number;
	socketId: string;
}

export const CATEGORIES = ["Science", "History", "Movies & TV", "Geography", "Sports", "Music"];
export const CAT_COLORS = ["var(--color-blue)", "var(--color-red)", "var(--color-green)", "var(--color-purple)", "var(--color-orange)", "var(--color-teal)"];
export const ROUND1_VALUES = [100, 200, 300, 400, 500];

export const SPECIAL_SECTORS: Sector[] = [
	{ type: "loseTurn", label: "Lose Turn", color: "var(--color-dark-grey)" },
	{ type: "freeSpin", label: "Free Spin", color: "var(--color-gold)" },
	{ type: "bankrupt", label: "Bankrupt", color: "var(--color-dark-red)" },
	{ type: "playersChoice", label: "Player's Choice", color: "#0ea5e9" },
	{ type: "opponentsChoice", label: "Opponents' Choice", color: "#c026d3" },
];

export const SECTORS: Sector[] = [
		...CATEGORIES.map((name, i) => ({ type: "category" as const, label: name, color: CAT_COLORS[i], catIndex: i })),
		...SPECIAL_SECTORS,
	];

export function makeBoard(values: number[]): Cell[][] {
	return CATEGORIES.map(() => values.map(() => ({ answered: false })));
}

export function valuesForRound(round: 1 | 2): number[] {
	return round === 1 ? ROUND1_VALUES : ROUND1_VALUES.map((v) => v * 2);
}
