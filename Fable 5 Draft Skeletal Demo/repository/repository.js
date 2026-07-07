/*
 * SS-03 Question Repository — SKELETAL increment.
 *
 * Exposes exactly the ten call signatures from SRS §6.3. Opens a SQLite
 * file directly via the built-in node:sqlite module (no ORM).
 *
 * Only getAllCategories() performs a REAL read from the SQLite file, to
 * prove the GL→Repo→SQLite connection works. The other nine functions
 * are stubs that log the call and return hardcoded data matching the
 * SRS §6.3 return shapes. See SKELETAL_NOTES.md.
 */
'use strict';

const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'questions.sqlite');
const db = new DatabaseSync(DB_PATH);

/* Bare-minimum schema (SRS §4.3 Category entity) — just enough to prove
 * real reads from the file. Seeded with 3 rows on first run. */
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    category_id   INTEGER PRIMARY KEY,
    category_name TEXT NOT NULL UNIQUE,
    description   TEXT
  )
`);

if (db.prepare('SELECT COUNT(*) AS n FROM categories').get().n === 0) {
  const insert = db.prepare('INSERT INTO categories (category_name, description) VALUES (?, ?)');
  insert.run('Science', 'Seed row 1 — proves real SQLite reads in the skeletal demo');
  insert.run('History', 'Seed row 2 — proves real SQLite reads in the skeletal demo');
  insert.run('Geography', 'Seed row 3 — proves real SQLite reads in the skeletal demo');
  console.log(`[Repo] Created and seeded ${DB_PATH}`);
}

function logCall(name, args) {
  console.log(`[GL→Repo] ${name}(${args.map((a) => JSON.stringify(a)).join(', ')})`);
}

/* Canned Question shape per SRS §4.3 (question + answers entities). */
const CANNED_QUESTION = {
  question_id: 1,
  category_id: 1,
  point_value: 200,
  question_text: 'Canned skeletal question — no real question data in this increment',
  question_type: 'plain',
  answers: [
    { answer_id: 1, answer_text: 'Canned answer A', is_correct: true },
    { answer_id: 2, answer_text: 'Canned answer B', is_correct: false },
  ],
};

module.exports = {
  /* REAL read — the one full GL→Repo→SQLite round trip in this increment. */
  getAllCategories() {
    logCall('getAllCategories', []);
    const rows = db.prepare('SELECT category_id, category_name, description FROM categories').all();
    console.log(`[Repo→GL] getAllCategories → ${rows.length} rows read from ${path.basename(DB_PATH)}`);
    return rows;
  },

  /* The nine stubs below return hardcoded data only — no queries, no
   * validation. The getters echo the requested id into the canned payload
   * so demo responses stay coherent with their requests. */
  getQuestionsByCategory(categoryId) {
    logCall('getQuestionsByCategory', [categoryId]);
    return [{ ...CANNED_QUESTION, category_id: categoryId }];
  },

  getQuestionById(questionId) {
    logCall('getQuestionById', [questionId]);
    return { ...CANNED_QUESTION, question_id: questionId };
  },

  validateRepository() {
    logCall('validateRepository', []);
    return { valid: true, errors: [] };
  },

  createCategory(name, description) {
    logCall('createCategory', [name, description]);
    return { categoryId: 999, success: true, error: null };
  },

  updateCategory(categoryId, name, description) {
    logCall('updateCategory', [categoryId, name, description]);
    return { success: true, error: null };
  },

  deleteCategory(categoryId) {
    logCall('deleteCategory', [categoryId]);
    return { success: true, error: null };
  },

  createQuestion(categoryId, pointValue, text, answers) {
    logCall('createQuestion', [categoryId, pointValue, text, answers]);
    return { questionId: 999, success: true, error: null };
  },

  updateQuestion(questionId, text, pointValue, answers) {
    logCall('updateQuestion', [questionId, text, pointValue, answers]);
    return { success: true, error: null };
  },

  deleteQuestion(questionId) {
    logCall('deleteQuestion', [questionId]);
    return { success: true, error: null };
  },
};
