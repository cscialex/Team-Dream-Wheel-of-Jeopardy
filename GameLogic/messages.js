const UI_TO_GL = {
  GAME_SETUP:             'GAME_SETUP',            // {playerNames: string[], randomizeTurnOrder: boolean}
  SPIN_WHEEL:             'SPIN_WHEEL',            // {}
  SELECT_QUESTION:        'SELECT_QUESTION',       // {categoryId, pointValue}
  SUBMIT_ANSWER:          'SUBMIT_ANSWER',         // {answerId}
  REDEEM_TOKEN:           'REDEEM_TOKEN',          // {}
  DECLINE_TOKEN:          'DECLINE_TOKEN',         // {}
  OPPONENTS_CHOICE_MADE:  'OPPONENTS_CHOICE_MADE', // {categoryId}
  ADMIN_CREATE_CATEGORY:  'ADMIN_CREATE_CATEGORY', // {name, description (optional)}
  ADMIN_UPDATE_CATEGORY:  'ADMIN_UPDATE_CATEGORY', // {categoryId, name, description (optional)}
  ADMIN_DELETE_CATEGORY:  'ADMIN_DELETE_CATEGORY', // {categoryId }
  ADMIN_CREATE_QUESTION:  'ADMIN_CREATE_QUESTION', // {categoryId, pointValue, text, answers[]}
  ADMIN_UPDATE_QUESTION:  'ADMIN_UPDATE_QUESTION', // {questionId, text, pointValue, answers[]}
  ADMIN_DELETE_QUESTION:  'ADMIN_DELETE_QUESTION', // {questionId}
};

const GL_TO_UI = {
  GAME_STATE_UPDATE:        'GAME_STATE_UPDATE',        // {players[], activePlayerIndex, round, spinsRemaining, boardState, phase}
  SPIN_RESULT:              'SPIN_RESULT',              // {sector}
  PROMPT_CATEGORY_SELECT:   'PROMPT_CATEGORY_SELECT',   // {availableCategories[], selector: 'active'|'opponents'}
  SHOW_QUESTION:            'SHOW_QUESTION',            // {questionText, answers: [{id, text}]}
  ANSWER_RESULT:            'ANSWER_RESULT',            // {correct, pointValue, updatedScore, announcerText}
  PROMPT_TOKEN_REDEMPTION:  'PROMPT_TOKEN_REDEMPTION',  // {tokensHeld, announcerText}
  TURN_CHANGED:             'TURN_CHANGED',             // {newActivePlayerIndex, announcerText}
  ROUND_END:                'ROUND_END',                // {roundScores: [{name, score}], nextRound?}
  GAME_OVER:                'GAME_OVER',                // {finalRanking: [{name, total}], winnerName}
  ERROR:                    'ERROR',                    // {code, message}
  ADMIN_OP_RESULT:          'ADMIN_OP_RESULT',          // {success, message}
};

const REPO_CALLS = [
  'getAllCategories',        // ()                                        → Category[]
  'getQuestionsByCategory',  // (categoryId)                              → Question[] — randomized
  'getQuestionById',         // (questionId)                              → Question with answers
  'validateRepository',      // ()                                        → {valid, errors[]}
  'createCategory',          // (name, description?)                      → {categoryId, success, error}
  'updateCategory',          // (categoryId, name, description?)          → {success, error}
  'deleteCategory',          // (categoryId)                              → {success, error}
  'createQuestion',          // (categoryId, pointValue, text, answers[]) → {questionId, success, error}
  'updateQuestion',          // (questionId, text, pointValue, answers[]) → {success, error}
  'deleteQuestion',          // (questionId)                              → {success, error}
];

const REPLY_MAP = {
  GAME_SETUP:             GL_TO_UI.GAME_STATE_UPDATE,
  SPIN_WHEEL:             GL_TO_UI.SPIN_RESULT,
  SELECT_QUESTION:        GL_TO_UI.SHOW_QUESTION,
  SUBMIT_ANSWER:          GL_TO_UI.ANSWER_RESULT,
  REDEEM_TOKEN:           GL_TO_UI.GAME_STATE_UPDATE,
  DECLINE_TOKEN:          GL_TO_UI.TURN_CHANGED,
  OPPONENTS_CHOICE_MADE:  GL_TO_UI.SHOW_QUESTION,
  ADMIN_CREATE_CATEGORY:  GL_TO_UI.ADMIN_OP_RESULT,
  ADMIN_UPDATE_CATEGORY:  GL_TO_UI.ADMIN_OP_RESULT,
  ADMIN_DELETE_CATEGORY:  GL_TO_UI.ADMIN_OP_RESULT,
  ADMIN_CREATE_QUESTION:  GL_TO_UI.ADMIN_OP_RESULT,
  ADMIN_UPDATE_QUESTION:  GL_TO_UI.ADMIN_OP_RESULT,
  ADMIN_DELETE_QUESTION:  GL_TO_UI.ADMIN_OP_RESULT,
};

/* Export for Node (game-logic, drivers); browser gets top-level consts. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UI_TO_GL, GL_TO_UI, REPO_CALLS, EXAMPLES, REPO_CALL_EXAMPLES, REPLY_MAP };
}
