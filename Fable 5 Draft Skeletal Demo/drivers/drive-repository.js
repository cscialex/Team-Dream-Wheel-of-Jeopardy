/*
 * Driver: tests SS-03 Repository WITHOUT Game Logic.
 *
 * Calls each of the ten SRS §6.3 functions directly and prints the
 * result. getAllCategories() is a real SQLite read; the rest are stubs.
 *
 * Usage: node drivers/drive-repository.js
 */
'use strict';

const repo = require('../repository/repository.js');

const sampleAnswers = [
  { answer_text: 'Canned answer A', is_correct: true },
  { answer_text: 'Canned answer B', is_correct: false },
];

/* Each SRS §6.3 call with sample arguments. */
const calls = [
  ['getAllCategories', () => repo.getAllCategories()],
  ['getQuestionsByCategory', () => repo.getQuestionsByCategory(1)],
  ['getQuestionById', () => repo.getQuestionById(1)],
  ['validateRepository', () => repo.validateRepository()],
  ['createCategory', () => repo.createCategory('Sample Category', 'optional description')],
  ['updateCategory', () => repo.updateCategory(1, 'Renamed Category', 'optional description')],
  ['deleteCategory', () => repo.deleteCategory(1)],
  ['createQuestion', () => repo.createQuestion(1, 200, 'Canned sample question text', sampleAnswers)],
  ['updateQuestion', () => repo.updateQuestion(1, 'Canned updated question text', 400, sampleAnswers)],
  ['deleteQuestion', () => repo.deleteQuestion(1)],
];

console.log(`Driving repository module directly with ${calls.length} SRS §6.3 calls...\n`);

for (const [name, invoke] of calls) {
  const result = invoke();
  console.log(`${name} →`);
  console.log(`${JSON.stringify(result, null, 2)}\n`);
}

console.log('Done — all 10 §6.3 calls exercised.');
