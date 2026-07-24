/*
 *
 *
 * Major TODO - update all commented out game messages to be notifyUI messages with correct payloads then map in server
 */

import Player from './Player'
import Wheel from './Wheel'
import QuestionBoard from './QuestionBoard'
import QuestionRepository from './QuestionRepository'
import Category from './Category'
import { GL_TO_UI } from './messages'

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

    constructor()

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
            // notifyUI GAME_STATE_UPDATE
            
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
            spinResult = wheel.spin();
            // notifyUI SPIN_RESULT(spinResult)
            this.resolveSector(spinResult);
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
                    // notifyUI board state update
                    // await SELECT_QUESTION
                }
                result = 1;
                break;
            case PLAYERS_CHOICE:
                // notifyUI PROMPT_CATEGORY_SELECT(open categories, 'active')
                result = 1;
                break;
            case OPPONENTS_CHOICE:
                // notifyUI PROMPT_CATEGORY_SELECT(open categories, 'opponents')
                result = 1;
                break;
            case FREE_SPIN:
                this.players[this.activePlayerIndex].grantToken();
                // notifyUI GAME_STATE_UPDATE
                // notifyUI respin message
                result = 1;
                break;
            case LOSE_TURN:
                if(this.players[this.activePlayerIndex].tokenCount > 0)
                {
                    // notifyUI PROMPT_TOKEN_REDEMPTION
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
        result = 0;

        if((this.phase == GamePhase.ROUND_1_ACTIVE || this.phase == GamePhase.ROUND_2_ACTIVE) && this.pendingQuestion == null)
        {
            available = board.availableValues(categoryId);
            if(!(pointValue in available))
            {
                // notifyUI ERROR("QUESTION_NOT_AVAILABLE")
                return result;
            }

            this.pendingQuestion = this.board.questionAt(categoryId, pointValue);
            if(this.pendingQuestion == null)
            {
                // notifyUI ERROR("QUESTION_NOT_FOUND")
                return result;
            }

            /*
            notifyUI SHOW_QUESTION
            ({
                questionText: this.pendingQuestion.questionText,
                answers: this.pendingQuestion.answers without correctness flag
            });
            */

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
            // notifyUI ERROR("NO_TOKEN_AVAILABLE")
            return result;
        }

        this.pendingQuestion = null;
        // notifyUI GAME_STATE_UPDATE
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
        // notifyUI TURN_CHANGED
        result = 1;
        return result;
    }

    transitionRound()
    {
        result = 0;

        if(this.currentRound == 1)
        {
            this.phase = GamePhase.END_ROUND_1;
            // notifyUI ROUND_END(round-1 scores)
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
        total = [];

        this.players.forEach((val) =>
        {
            total[val] = val.totalScore();
        });

        // ranking = players sorted by total, descending
        // winners = all players tied at maximum total
        this.phase = GamePhase.GAME_OVER;
        // notifyUI GAME_OVER(ranking, winners)
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
