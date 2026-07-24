import Player from './Player'
import Wheel from './Wheel'
import QuestionBoard from './QuestionBoard'
import QuestionRepository from './QuestionRepository'
import Category from './Category'
import { GL_TO_UI, UI_TO_GL } from './messages'

const GamePhase = Object.freeze({
    SETUP: 0,
    ROUND_1_ACTIVE: 1,
    END_ROUND_1: 2,
    ROUND_2_ACTIVE: 3,
    GAME_OVER: 4
});

export default class GameSession
{
    players;
    wheel;
    board;
    repository;
    selectedCategories = [];
    activePlayerIndex;
    currentRound;
    spinsRemaining;
    phase;
    pendingQuestion;
    spinResult;
    notifyUI;

    constructor(notifyUI = () => {})
    {
        this.players = [];
        this.repository = new QuestionRepository();
        this.activePlayerIndex = 1;
        this.currentRound = 1;
        this.spinsRemaining = 30;
        this.phase = GamePhase.SETUP;
        this.pendingQuestion = null;
        this.spinResult = null;
        this.notifyUI = notifyUI;
    }

    handleUI({type, payload = {} })
    {
        switch(type)
        {
            case UI_TO_GL.GAME_SETUP:               return this.startGame(payload.playerNames, payload.categories);
            case UI_TO_GL.SPIN_WHEEL:               return this.spinWheel();
            case UI_TO_GL.SELECT_QUESTION:          return this.selectQuestion(payload.categoryId, payload.pointValue);
            case UI_TO_GL.SUBMIT_ANSWER:            return this.evaluateAnswer(payload.answerId);
            case UI_TO_GL.REDEEM_TOKEN:             return this.redeemToken();
            case UI_TO_GL.DECLINE_TOKEN:            return this.declineToken();
            case UI_TO_GL.OPPONENTS_CHOICE_MADE:    return this.selectCategory(payload.categoryId);
            default:
                this.notifyUI({
                    type: GL_TO_UI.ERROR,
                    payload: {
                        code: 'UNKNOWN_MESSAGE',
                        message: '$(type) message type unknown or unhandled.'
                    }
                });
        }
    }

    startGame(playerNames, categories)
    {
        result = 0;
        if(playerNames.length > 2
            || playerNames.length < 4
            || this.repository.validateRepository() == 1)
        {
            playerNames.forEach((val, i) =>
            {
                this.players[i] = Player(playerNames[i]);
            });

            this.wheel = new Wheel(selectedCategories);

            this.board = new QuestionBoard(
                categories.forEach((val,i) =>
                {
                    this.repository.getQuestionsByCategory(c)
                })
            );

            this.activePlayerIndex = 0;
            this.phase = GamePhase.ROUND_1_ACTIVE;

            this.notifyUI({
                type: GL_TO_UI.GAME_STATE_UPDATE,
                payload: {
                    players: this.players,
                    activePlayerIndex: this.activePlayerIndex,
                    round: this.currentRound,
                    spinsRemaining: this.spinsRemaining,
                    board: this.board,
                    phase: this.phase
                }
            });
            
            result = 1;
        }
        return result;
    }

    spinWheel()
    {
        result = 0;

        if(this.phase == GamePhase.ROUND_1_ACTIVE || this.phase == GamePhase.ROUND_2_ACTIVE)
        {
            this.spinsRemaining = this.spinsRemaining - 1;
            this.spinResult = wheel.spin();
            
            this.notifyUI({
                type: GL_TO_UI.SPIN_RESULT,
                payload: {
                    sector: this.spinResult
                }
            });

            this.resolveSector(this.spinResult);
        }
    }

    resolveSector(sector)
    {
        result = 0;
        switch(sector.sectorType)
        {
            case CATEGORY:
                if(this.board.isCategoryExhausted(sector.category))
                {
                    this.spinsRemaining = this.spinsRemaining + 1;
                    // notifyUI respin message
                }
                else
                {
                    this.notifyUI({
                        type: GL_TO_UI.GAME_STATE_UPDATE,
                        payload: {
                            players: this.players,
                            activePlayerIndex: this.activePlayerIndex,
                            round: this.currentRound,
                            spinsRemaining: this.spinsRemaining,
                            board: this.board,
                            phase: this.phase
                        }
                    });
                }
                result = 1;
                break;

            case PLAYERS_CHOICE:
                let availCategoriesAct = [];
                let i = 0;

                this.board.categories.forEach((cat) => {
                    if(this.board.isCategoryExhausted(cat) == false)
                    {
                        availCategoriesAct[i] = cat;
                        i = i + 1;
                    }
                });

                this.notifyUI({
                    type: GL_TO_UI.PROMPT_CATEGORY_SELECT,
                    payload: {
                        availableCategories: availCategoriesAct,
                        selector: 'active'
                    }
                });

                result = 1;
                break;

            case OPPONENTS_CHOICE:
                let availCategoriesOpp = [];
                let j = 0;

                this.board.categories.forEach((cat) => {
                    if(this.board.isCategoryExhausted(cat) == false)
                    {
                        availCategoriesOpp[j] = cat;
                        j = j + 1;
                    }
                });

                this.notifyUI({
                    type: GL_TO_UI.PROMPT_CATEGORY_SELECT,
                    payload: {
                        availableCategories: availCategoriesOpp,
                        selector: 'opponents'
                    }
                });

                result = 1;
                break;

            case FREE_SPIN:
                this.players[this.activePlayerIndex].grantToken();

                this.notifyUI({
                    type: GL_TO_UI.GAME_STATE_UPDATE,
                    payload: {
                        players: this.players,
                        activePlayerIndex: this.activePlayerIndex,
                        round: this.currentRound,
                        spinsRemaining: this.spinsRemaining,
                        board: this.board,
                        phase: this.phase
                    }
                });

                // notifyUI respin message
                result = 1;
                break;

            case LOSE_TURN:
                if(this.players[this.activePlayerIndex].tokenCount > 0)
                {
                    this.notifyUI({
                        type: GL_TO_UI.PROMPT_TOKEN_REDEMPTION,
                        payload: {
                            tokensHeld: player.tokenCount,
                            announcerText: '${player.name}, use a Free Spin Token to try again?'
                        },
                    });
                }
                else
                {
                    this.advanceTurn();
                }
                result = 1;
                break;
            case BANKRUPT:
                this.players[this.activePlayerIndex].resetRoundScore(this.currentRound);
                this.players[this.activePlayerIndex].forfeitAllTokens();
                this.advanceTurn();
                result = 1;
                break;
            default:
                break;
        }
        return result;
    }

    selectQuestion(categoryId, pointValue)
    {
        let result = 0;

        if((this.phase == GamePhase.ROUND_1_ACTIVE || this.phase == GamePhase.ROUND_2_ACTIVE) && this.pendingQuestion == null)
        {
            available = board.availableValues(categoryId);
            if(!(pointValue in available))
            {
                this.notifyUI({
                    type: GL_TO_UI.ERROR,
                    payload: {
                        code: "QUESTION_NOT_AVAILABLE",
                        message: "Question not available to select."
                    }
                });
                
                return result;
            }

            this.pendingQuestion = this.board.questionAt(categoryId, pointValue);
            if(this.pendingQuestion == null)
            {
                this.notifyUI({
                    type: GL_TO_UI.ERROR,
                    payload: {
                        code: "QUESTION_NOT_FOUND",
                        message: "Question not found."
                    }
                });

                return result;
            }

            let answersNoCorrectness = [];
            const quesAns = this.pendingQuestion.answers;

            quesAns.forEach((ans, i) => {
                answersNoCorrectness[i] = {ans.answerId, ans.answerText};
            });

            this.notifyUI({
                type: GL_TO_UI.SHOW_QUESTION,
                payload: {
                    questionText: this.pendingQuestion.questionText,
                    answers: answersNoCorrectness
                }
            });

            result = 1;
        }

        return result;
    }

    evaluateAnswer(answerId)
    {
        let result = 0;

        if(this.pendingQuestion == null) 
        {
            return result;
        }

        if( this.pendingQuestion != null )
        {
            const correct = this.pendingQuestion.isCorrect(answerId);
            const points = this.pendingQuestion.pointValue * this.roundMultiplier();
            const player = this.players[this.activePlayerIndex];

            this.board.markAnswered(this.pendingQuestion.categoryId,
                                    this.pendingQuestion.pointValue);
            
            if(correct)
            {
                player.addPoints(this.currentRound, points);
            }
            else
            {
                player.deductPoints(this.currentRound, points); // always deduct points - TODO: only deduct when token not redeemed
                if(this.players[this.activePlayerIndex].tokenCount > 0)
                {
                    this.notifyUI({
                        type: GL_TO_UI.PROMPT_TOKEN_REDEMPTION,
                        payload: {
                            tokensHeld: player.tokenCount,
                            announcerText: '${player.name}, use a Free Spin Token to try again?'
                        },
                    });
                }
                else
                {
                    this.advanceTurn();
                }
            }

            this.pendingQuestion == null;

            result = 1
        }
        
        return result;
    }

    redeemToken()
    {
        result = 0;

        player = this.players[this.activePlayerIndex];

        if(player.redeemToken() == false)
        {
            this.notifyUI({
                type: GL_TO_UI.ERROR,
                payload: {
                    code: 'NO_TOKEN_AVAILABLE',
                    message: 'No token available to redeem.'
                }
            });

            return result;
        }

        this.pendingQuestion = null;
        
        this.notifyUI({
            type: GL_TO_UI.GAME_STATE_UPDATE,
            payload: {
                players: this.players,
                activePlayerIndex: this.activePlayerIndex,
                round: this.currentRound,
                spinsRemaining: this.spinsRemaining,
                board: this.board,
                phase: this.phase
            }
        });

        // notifyUI prompt active player to spin again
        result = 1;
        return result;
    }

    declineToken()
    {
        pendingQuestion = null;
        return this.advanceTurn();
    }

    advanceTurn()
    {
        result = 0;

        if(this.spinsRemaining == 0 || this.board.allCellsAnswered())
        {
            this.transitionRound();
            result = 1;
            return result;
        }

        this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
        
        this.notifyUI({
            type: GL_TO_UI.TURN_CHANGED,
            payload: {
                newActivePlayerIndex: this.activePlayerIndex,
                announcerText: '${player.name}, it is now your turn.'
            }
        })

        result = 1;
        return result;
    }

    transitionRound()
    {
        let result = 0;
        let playerTotals = [];

        if(this.currentRound == 1)
        {
            this.phase = GamePhase.END_ROUND_1;

            this.players.forEach((val, i) =>
            {
                playerTotals[i] = {val, val.totalScore()}
            });

            this.notifyUI({
                type: GL_TO_UI.ROUND_END,
                payload: {
                    roundScores: playerTotals
                }
            });

            this.currentRound = 2;
            this.spinsRemaining = 30;
            this.board.rebuildForRound2();
            this.phase = GamePhase.ROUND_2_ACTIVE;
            result = 1;
        }
        else(this.currentRound == 2)
        {
            this.finalizeGame();
            result = 1;
        }
        
        return result;
    }

    finalizeGame()
    {
        let playerTotals = [];
        let maxPointVal;
        let winningPlayers = [];

        this.players.forEach((val, i) =>
        {
            playerTotals[i] = {val, val.totalScore()}
        });

        playerTotals.sort((a,b) => b[1] - a[1]);

        maxPointVal = Math.max(...playerTotals.map(scoreMatch => scoreMatch[1]));

        winningPlayers = playerTotals.filter(([pl, pts]) => pts === maxPointVal).map(([pl, pts]) => pl);

        this.phase = GamePhase.GAME_OVER;

        this.notifyUI({
            type: GL_TO_UI.GAME_OVER,
            payload: {
                finalRanking: playerTotals,
                winners: winningPlayers
            }
        });
    }

    roundMultiplier()
    {
        if(this.currentRound == 1 || this.currentRound == 2)
        {
            return this.currentRound;
        }
        else
        {
            return 0;
        }
    }
}
