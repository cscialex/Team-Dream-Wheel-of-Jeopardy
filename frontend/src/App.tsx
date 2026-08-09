import { GameScreen } from "./components/screens/game-screen/GameScreen";
import SetupScreen from "./components/screens/setup-screen/SetupScreen";
import GameOverScreen from "./components/screens/game-over-screen/GameOverScreen";
import useGameStore from "./store/gameStore";

/**
 * App switches the page rendered based on the phase in the data store.
 * 
 * Note: AdminPanel and SetupScreen are not currently implemented
 * @returns Screens dependent on game phase
 */
function App() {
	const phase = useGameStore((s) => s.phase);

	switch (phase) {
		case "setup":
			return <SetupScreen />
		case "playing":
			return <GameScreen />
		case "gameOver":
			return <GameOverScreen />
		default:
			throw new Error("Invalid phase provided");
	}
}

export default App
