import { GameScreen } from "./components/screens/game-screen/GameScreen";

/**
 * App switches the page rendered based on the phase in the data store.
 * 
 * Note: AdminPanel and SetupScreen are not currently implemented
 * @returns Screens dependent on game phase
 */
function App() {
	return <GameScreen />
}

export default App
