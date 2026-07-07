/*
 * Shared message contract for the Wheel of Jeopardy SKELETAL increment.
 *
 * Every message name and payload shape below comes from SRS §6
 * (Subsystem Interfaces). This single file is loaded by BOTH the
 * browser UI (classic <script> tag) and the Node.js game-logic server
 * (require), so the SRS-defined interface is visible in one place.
 *
 * Payload EXAMPLES are canned instances of the SRS payload shapes.
 * They contain no game logic — values are fixed demo data.
 */

/* ------------------------------------------------------------------ */
/* SRS §6.1 — UI → Game Logic messages (13)                            */
/* ------------------------------------------------------------------ */
const UI_TO_GL = {
  GAME_SETUP: 'GAME_SETUP',                     // { playerNames: string[], randomizeTurnOrder: boolean }
  SPIN_WHEEL: 'SPIN_WHEEL',                     // { } — active player activates Spin button
  SELECT_QUESTION: 'SELECT_QUESTION',           // { categoryId, pointValue }
  SUBMIT_ANSWER: 'SUBMIT_ANSWER',               // { answerId }
  REDEEM_TOKEN: 'REDEEM_TOKEN',                 // { }
  DECLINE_TOKEN: 'DECLINE_TOKEN',               // { }
  OPPONENTS_CHOICE_MADE: 'OPPONENTS_CHOICE_MADE', // { categoryId }
  ADMIN_CREATE_CATEGORY: 'ADMIN_CREATE_CATEGORY', // { name, description (optional) }
  ADMIN_UPDATE_CATEGORY: 'ADMIN_UPDATE_CATEGORY', // { categoryId, name, description (optional) }
  ADMIN_DELETE_CATEGORY: 'ADMIN_DELETE_CATEGORY', // { categoryId }
  ADMIN_CREATE_QUESTION: 'ADMIN_CREATE_QUESTION', // { categoryId, pointValue, text, answers[] }
  ADMIN_UPDATE_QUESTION: 'ADMIN_UPDATE_QUESTION', // { questionId, text, pointValue, answers[] }
  ADMIN_DELETE_QUESTION: 'ADMIN_DELETE_QUESTION', // { questionId }
};

/* ------------------------------------------------------------------ */
/* SRS §6.2 — Game Logic → UI messages (11)                            */
/* ------------------------------------------------------------------ */
const GL_TO_UI = {
  GAME_STATE_UPDATE: 'GAME_STATE_UPDATE',       // full snapshot: players[], activePlayerIndex, round, spinsRemaining, boardState, phase
  SPIN_RESULT: 'SPIN_RESULT',                   // { sector }
  PROMPT_CATEGORY_SELECT: 'PROMPT_CATEGORY_SELECT', // { availableCategories[], selector: 'active'|'opponents' }
  SHOW_QUESTION: 'SHOW_QUESTION',               // { questionText, answers: [{id, text}] }
  ANSWER_RESULT: 'ANSWER_RESULT',               // { correct, pointValue, updatedScore, announcerText }
  PROMPT_TOKEN_REDEMPTION: 'PROMPT_TOKEN_REDEMPTION', // { tokensHeld, announcerText }
  TURN_CHANGED: 'TURN_CHANGED',                 // { newActivePlayerIndex, announcerText }
  ROUND_END: 'ROUND_END',                       // { roundScores: [{name, score}], nextRound? }
  GAME_OVER: 'GAME_OVER',                       // { finalRanking: [{name, total}], winnerName }
  ERROR: 'ERROR',                               // { code, message }
  ADMIN_OP_RESULT: 'ADMIN_OP_RESULT',           // { success, message }
};

/* ------------------------------------------------------------------ */
/* SRS §6.3 — Game Logic → Repository call signatures (10)             */
/* ------------------------------------------------------------------ */
const REPO_CALLS = [
  'getAllCategories',        // () → Category[]
  'getQuestionsByCategory',  // (categoryId) → Question[] — randomized
  'getQuestionById',         // (questionId) → Question with answers
  'validateRepository',      // () → { valid, errors[] }
  'createCategory',          // (name, description?) → { categoryId, success, error }
  'updateCategory',          // (categoryId, name, description?) → { success, error }
  'deleteCategory',          // (categoryId) → { success, error }
  'createQuestion',          // (categoryId, pointValue, text, answers[]) → { questionId, success, error }
  'updateQuestion',          // (questionId, text, pointValue, answers[]) → { success, error }
  'deleteQuestion',          // (questionId) → { success, error }
];

/* ------------------------------------------------------------------ */
/* Canned example payloads (fixed demo instances of the SRS shapes).   */
/* Player-record fields follow SRS §4.2; answer fields follow §4.3.    */
/* ------------------------------------------------------------------ */
const EXAMPLES = {
  /* §6.1 UI→GL */
  GAME_SETUP: { playerNames: ['Alice', 'Bob'], randomizeTurnOrder: false },
  SPIN_WHEEL: {},
  SELECT_QUESTION: { categoryId: 1, pointValue: 200 },
  SUBMIT_ANSWER: { answerId: 1 },
  REDEEM_TOKEN: {},
  DECLINE_TOKEN: {},
  OPPONENTS_CHOICE_MADE: { categoryId: 2 },
  ADMIN_CREATE_CATEGORY: { name: 'Sample Category', description: 'optional description' },
  ADMIN_UPDATE_CATEGORY: { categoryId: 1, name: 'Renamed Category', description: 'optional description' },
  ADMIN_DELETE_CATEGORY: { categoryId: 1 },
  ADMIN_CREATE_QUESTION: {
    categoryId: 1,
    pointValue: 200,
    text: 'Canned sample question text',
    answers: [
      { answer_text: 'Canned answer A', is_correct: true },
      { answer_text: 'Canned answer B', is_correct: false },
    ],
  },
  ADMIN_UPDATE_QUESTION: {
    questionId: 1,
    text: 'Canned updated question text',
    pointValue: 400,
    answers: [
      { answer_text: 'Canned answer A', is_correct: true },
      { answer_text: 'Canned answer B', is_correct: false },
    ],
  },
  ADMIN_DELETE_QUESTION: { questionId: 1 },

  /* §6.2 GL→UI (canned replies — NO rule evaluation, NO state machine) */
  GAME_STATE_UPDATE: {
    players: [
      { name: 'Alice', round1Score: 0, round2Score: 0, totalScore: 0, tokenCount: 0 },
      { name: 'Bob', round1Score: 0, round2Score: 0, totalScore: 0, tokenCount: 0 },
    ],
    activePlayerIndex: 0,
    round: 1,
    spinsRemaining: 30,
    boardState: { note: 'canned boardState stub — real shape arrives in the minimal increment' },
    phase: 'Setup',
  },
  SPIN_RESULT: { sector: 3 },
  PROMPT_CATEGORY_SELECT: {
    availableCategories: [
      { category_id: 1, category_name: 'Science' },
      { category_id: 2, category_name: 'History' },
    ],
    selector: 'active',
  },
  SHOW_QUESTION: {
    questionText: 'Canned skeletal question — no real question data in this increment',
    answers: [
      { id: 1, text: 'Canned answer A' },
      { id: 2, text: 'Canned answer B' },
    ],
  },
  ANSWER_RESULT: {
    correct: true,
    pointValue: 200,
    updatedScore: 200,
    announcerText: 'Canned response — no scoring logic in the skeletal increment.',
  },
  PROMPT_TOKEN_REDEMPTION: { tokensHeld: 1, announcerText: 'Canned token prompt — no token logic in skeletal.' },
  TURN_CHANGED: { newActivePlayerIndex: 1, announcerText: 'Canned turn change — no turn management in skeletal.' },
  ROUND_END: { roundScores: [{ name: 'Alice', score: 0 }, { name: 'Bob', score: 0 }], nextRound: 2 },
  GAME_OVER: { finalRanking: [{ name: 'Alice', total: 0 }, { name: 'Bob', total: 0 }], winnerName: 'Alice' },
  ERROR: { code: 'UNKNOWN_MESSAGE', message: 'Message type not defined in SRS §6.1.' },
  ADMIN_OP_RESULT: { success: true, message: 'Canned skeletal stub — no real admin operation performed.' },
};

/*
 * Canned example arguments for each SRS §6.3 repository call, in
 * signature order. Used by the demo harness to invoke GL→Repo calls
 * (values mirror the §6.1/§4.3 examples above — fixed demo data only).
 */
const REPO_CALL_EXAMPLES = {
  getAllCategories: [],
  getQuestionsByCategory: [1],
  getQuestionById: [1],
  validateRepository: [],
  createCategory: ['Sample Category', 'optional description'],
  updateCategory: [1, 'Renamed Category', 'optional description'],
  deleteCategory: [1],
  createQuestion: [1, 200, 'Canned sample question text', [
    { answer_text: 'Canned answer A', is_correct: true },
    { answer_text: 'Canned answer B', is_correct: false },
  ]],
  updateQuestion: [1, 'Canned updated question text', 400, [
    { answer_text: 'Canned answer A', is_correct: true },
    { answer_text: 'Canned answer B', is_correct: false },
  ]],
  deleteQuestion: [1],
};

/*
 * Canned reply mapping: which §6.2 message the game-logic stub returns
 * for each §6.1 message. Responses are HARDCODED instances of EXAMPLES —
 * the mapping is a demo pairing only, not rule evaluation.
 */
const REPLY_MAP = {
  GAME_SETUP: GL_TO_UI.GAME_STATE_UPDATE,
  SPIN_WHEEL: GL_TO_UI.SPIN_RESULT,
  SELECT_QUESTION: GL_TO_UI.SHOW_QUESTION,
  SUBMIT_ANSWER: GL_TO_UI.ANSWER_RESULT,
  REDEEM_TOKEN: GL_TO_UI.GAME_STATE_UPDATE,
  DECLINE_TOKEN: GL_TO_UI.TURN_CHANGED,
  OPPONENTS_CHOICE_MADE: GL_TO_UI.SHOW_QUESTION,
  ADMIN_CREATE_CATEGORY: GL_TO_UI.ADMIN_OP_RESULT,
  ADMIN_UPDATE_CATEGORY: GL_TO_UI.ADMIN_OP_RESULT,
  ADMIN_DELETE_CATEGORY: GL_TO_UI.ADMIN_OP_RESULT,
  ADMIN_CREATE_QUESTION: GL_TO_UI.ADMIN_OP_RESULT,
  ADMIN_UPDATE_QUESTION: GL_TO_UI.ADMIN_OP_RESULT,
  ADMIN_DELETE_QUESTION: GL_TO_UI.ADMIN_OP_RESULT,
};

/* Export for Node (game-logic, drivers); browser gets top-level consts. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UI_TO_GL, GL_TO_UI, REPO_CALLS, EXAMPLES, REPO_CALL_EXAMPLES, REPLY_MAP };
}
