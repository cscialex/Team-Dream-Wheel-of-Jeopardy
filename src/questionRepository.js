import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * SS-03 Question Repository Subsystem.
 *
 * This class is the data-tier facade used by the backend/game logic.
 * It wraps SQLite and exposes the repository calls from the SRS:
 *   - getAllCategories()
 *   - getQuestionsByCategory(categoryId)
 *   - getQuestionById(questionId)
 *   - validateRepository()
 *
 * The current frontend board uses six categories and point values
 * 100/200/300/400/500, so this seed data matches the existing UI.
 */
export default class QuestionRepository {
  constructor(dbPath = process.env.WOJ_DB_PATH ?? path.resolve(process.cwd(), "database/woj_questions.db")) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("foreign_keys = ON");
    this.initializeSchema();
  }

  initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS category (
        category_id INTEGER PRIMARY KEY,
        category_name TEXT NOT NULL UNIQUE,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS question (
        question_id INTEGER PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES category(category_id) ON DELETE CASCADE,
        point_value INTEGER NOT NULL CHECK (point_value IN (100, 200, 300, 400, 500)),
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL DEFAULT 'plain'
          CHECK (question_type IN ('plain', 'image', 'audio', 'video'))
      );

      CREATE TABLE IF NOT EXISTS answer (
        answer_id INTEGER PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES question(question_id) ON DELETE CASCADE,
        answer_text TEXT NOT NULL,
        is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1))
      );

      CREATE TABLE IF NOT EXISTS media_asset (
        asset_id INTEGER PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES question(question_id) ON DELETE CASCADE,
        asset_type TEXT CHECK (asset_type IN ('image', 'audio', 'video')),
        file_path TEXT,
        duration_seconds INTEGER CHECK (duration_seconds <= 15)
      );
    `);
  }

  /**
   * Adds sample data only when the category table is empty.
   * This is safe to call every time the backend starts.
   */
  seedIfEmpty() {
    const existing = this.db.prepare("SELECT COUNT(*) AS count FROM category").get();
    if (existing.count > 0) return;

    const categories = [
      ["Science", "Basic science questions"],
      ["History", "Historical people and events"],
      ["Movies & TV", "Film and television trivia"],
      ["Geography", "Countries, capitals, and landmarks"],
      ["Sports", "Sports and games"],
      ["Music", "Music trivia"],
    ];

    const insertCategory = this.db.prepare(`
      INSERT INTO category (category_name, description)
      VALUES (?, ?)
    `);

    for (const [name, description] of categories) {
      insertCategory.run(name, description);
    }

    const categoryRows = this.getAllCategories();
    const categoryIdByName = new Map(categoryRows.map((category) => [category.categoryName, category.categoryId]));

    const seedQuestions = [
      // Science
      q("Science", 100, "What planet is known as the Red Planet?", "Mars", "Venus", "Jupiter"),
      q("Science", 200, "What gas do humans need to breathe?", "Oxygen", "Helium", "Carbon dioxide"),
      q("Science", 300, "What force pulls objects toward Earth?", "Gravity", "Magnetism", "Friction"),
      q("Science", 400, "What is H2O commonly known as?", "Water", "Salt", "Hydrogen"),
      q("Science", 500, "What part of the cell contains DNA?", "Nucleus", "Ribosome", "Cell wall"),

      // History
      q("History", 100, "Who was the first president of the United States?", "George Washington", "Thomas Jefferson", "Abraham Lincoln"),
      q("History", 200, "In what year did World War II end?", "1945", "1918", "1963"),
      q("History", 300, "Which ancient civilization built the pyramids at Giza?", "Egyptians", "Romans", "Greeks"),
      q("History", 400, "The Declaration of Independence was signed in what year?", "1776", "1789", "1812"),
      q("History", 500, "Who led the civil rights March on Washington in 1963?", "Martin Luther King Jr.", "Frederick Douglass", "Booker T. Washington"),

      // Movies & TV
      q("Movies & TV", 100, "What movie features the character Simba?", "The Lion King", "Toy Story", "Finding Nemo"),
      q("Movies & TV", 200, "What streaming series is set in Hawkins, Indiana?", "Stranger Things", "The Office", "Friends"),
      q("Movies & TV", 300, "Who directed Jurassic Park?", "Steven Spielberg", "James Cameron", "Christopher Nolan"),
      q("Movies & TV", 400, "What movie series features the One Ring?", "The Lord of the Rings", "Harry Potter", "Star Wars"),
      q("Movies & TV", 500, "What fictional school does Harry Potter attend?", "Hogwarts", "Xavier's School", "Starfleet Academy"),

      // Geography
      q("Geography", 100, "What is the capital of France?", "Paris", "Madrid", "Rome"),
      q("Geography", 200, "Which ocean is the largest?", "Pacific Ocean", "Atlantic Ocean", "Indian Ocean"),
      q("Geography", 300, "What country is home to the city of Kyoto?", "Japan", "China", "Thailand"),
      q("Geography", 400, "What is the longest river in the world?", "Nile River", "Amazon River", "Mississippi River"),
      q("Geography", 500, "Mount Everest lies in which mountain range?", "Himalayas", "Andes", "Rockies"),

      // Sports
      q("Sports", 100, "How many points is a touchdown worth in American football?", "6", "3", "7"),
      q("Sports", 200, "How many players are on the court for one basketball team?", "5", "6", "9"),
      q("Sports", 300, "What sport uses the terms love, deuce, and ace?", "Tennis", "Golf", "Baseball"),
      q("Sports", 400, "How many bases are on a baseball field?", "4", "3", "5"),
      q("Sports", 500, "What international event awards gold, silver, and bronze medals?", "The Olympics", "The World Series", "The Super Bowl"),

      // Music
      q("Music", 100, "How many strings does a standard guitar have?", "6", "4", "8"),
      q("Music", 200, "What instrument has black and white keys?", "Piano", "Violin", "Trumpet"),
      q("Music", 300, "What does BPM measure in music?", "Tempo", "Volume", "Pitch"),
      q("Music", 400, "Which family of instruments includes the flute and clarinet?", "Woodwinds", "Percussion", "Strings"),
      q("Music", 500, "What symbol indicates the pitch of written music at the start of a staff?", "Clef", "Rest", "Bar line"),
    ];

    for (const item of seedQuestions) {
      const categoryId = categoryIdByName.get(item.categoryName);
      if (categoryId === undefined) {
        throw new Error(`Missing seed category: ${item.categoryName}`);
      }
      this.createQuestion(categoryId, item.pointValue, item.text, item.answers);
    }
  }

  getAllCategories() {
    const rows = this.db.prepare(`
      SELECT category_id, category_name, description
      FROM category
      ORDER BY category_id
    `).all();

    return rows.map(mapCategory);
  }

  getQuestionsByCategory(categoryId) {
    const rows = this.db.prepare(`
      SELECT question_id, category_id, point_value, question_text, question_type
      FROM question
      WHERE category_id = ?
      ORDER BY RANDOM()
    `).all(categoryId);

    return rows.map((row) => this.buildQuestion(row));
  }

  getQuestionById(questionId) {
    const row = this.db.prepare(`
      SELECT question_id, category_id, point_value, question_text, question_type
      FROM question
      WHERE question_id = ?
    `).get(questionId);

    return row ? this.buildQuestion(row) : null;
  }

  getQuestionForCategoryAndValue(categoryId, pointValue) {
    const row = this.db.prepare(`
      SELECT question_id, category_id, point_value, question_text, question_type
      FROM question
      WHERE category_id = ? AND point_value = ?
      ORDER BY RANDOM()
      LIMIT 1
    `).get(categoryId, pointValue);

    return row ? this.buildQuestion(row) : null;
  }

  validateRepository() {
    const errors = [];

    const categoryCount = this.db.prepare("SELECT COUNT(*) AS count FROM category").get();
    if (categoryCount.count < 6) {
      errors.push("Repository must contain at least 6 categories.");
    }

    const categories = this.getAllCategories();
    for (const category of categories) {
      const questionCount = this.db.prepare(`
        SELECT COUNT(*) AS count
        FROM question
        WHERE category_id = ?
      `).get(category.categoryId);

      if (questionCount.count < 5) {
        errors.push(`Category '${category.categoryName}' must contain at least 5 questions.`);
      }
    }

    const answerStats = this.db.prepare(`
      SELECT
        q.question_id,
        q.question_text,
        COUNT(a.answer_id) AS answer_count,
        SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_count
      FROM question q
      LEFT JOIN answer a ON a.question_id = q.question_id
      GROUP BY q.question_id
    `).all();

    for (const row of answerStats) {
      if (row.answer_count !== 3) {
        errors.push(`Question ${row.question_id} must contain exactly 3 answers.`);
      }
      if (row.correct_count !== 1) {
        errors.push(`Question ${row.question_id} must contain exactly 1 correct answer.`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  createCategory(name, description = null) {
    try {
      const result = this.db.prepare(`
        INSERT INTO category (category_name, description)
        VALUES (?, ?)
      `).run(name, description);

      return { categoryId: Number(result.lastInsertRowid), success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  updateCategory(categoryId, name, description = null) {
    try {
      const result = this.db.prepare(`
        UPDATE category
        SET category_name = ?, description = ?
        WHERE category_id = ?
      `).run(name, description, categoryId);

      return result.changes === 0
        ? { success: false, error: "Category not found." }
        : { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  deleteCategory(categoryId) {
    try {
      const result = this.db.prepare("DELETE FROM category WHERE category_id = ?").run(categoryId);
      return result.changes === 0
        ? { success: false, error: "Category not found." }
        : { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  createQuestion(categoryId, pointValue, text, answers, questionType = "plain") {
    const validationError = validateAnswers(answers);
    if (validationError) return { success: false, error: validationError };

    const tx = this.db.transaction(() => {
      const result = this.db.prepare(`
        INSERT INTO question (category_id, point_value, question_text, question_type)
        VALUES (?, ?, ?, ?)
      `).run(categoryId, pointValue, text, questionType);

      const questionId = Number(result.lastInsertRowid);
      const insertAnswer = this.db.prepare(`
        INSERT INTO answer (question_id, answer_text, is_correct)
        VALUES (?, ?, ?)
      `);

      for (const answer of answers) {
        insertAnswer.run(questionId, answer.answerText, answer.isCorrect ? 1 : 0);
      }

      return questionId;
    });

    try {
      return { questionId: tx(), success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  updateQuestion(questionId, categoryId, pointValue, text, answers, questionType = "plain") {
    const validationError = validateAnswers(answers);
    if (validationError) return { success: false, error: validationError };

    const tx = this.db.transaction(() => {
      const update = this.db.prepare(`
        UPDATE question
        SET category_id = ?, point_value = ?, question_text = ?, question_type = ?
        WHERE question_id = ?
      `).run(categoryId, pointValue, text, questionType, questionId);

      if (update.changes === 0) {
        throw new Error("Question not found.");
      }

      this.db.prepare("DELETE FROM answer WHERE question_id = ?").run(questionId);
      const insertAnswer = this.db.prepare(`
        INSERT INTO answer (question_id, answer_text, is_correct)
        VALUES (?, ?, ?)
      `);

      for (const answer of answers) {
        insertAnswer.run(questionId, answer.answerText, answer.isCorrect ? 1 : 0);
      }
    });

    try {
      tx();
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  deleteQuestion(questionId) {
    try {
      const result = this.db.prepare("DELETE FROM question WHERE question_id = ?").run(questionId);
      return result.changes === 0
        ? { success: false, error: "Question not found." }
        : { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  }

  buildQuestion(row) {
    const answers = this.db.prepare(`
      SELECT answer_id, question_id, answer_text, is_correct
      FROM answer
      WHERE question_id = ?
      ORDER BY answer_id
    `).all(row.question_id);

    return {
      questionId: row.question_id,
      categoryId: row.category_id,
      pointValue: row.point_value,
      questionText: row.question_text,
      questionType: row.question_type,
      answers: answers.map(mapAnswer),
    };
  }
}

function mapCategory(row) {
  return {
    categoryId: row.category_id,
    categoryName: row.category_name,
    description: row.description,
  };
}

function mapAnswer(row) {
  return {
    answerId: row.answer_id,
    questionId: row.question_id,
    answerText: row.answer_text,
    isCorrect: row.is_correct === 1,
  };
}

function validateAnswers(answers) {
  if (!Array.isArray(answers) || answers.length !== 3) {
    return "Each question must contain exactly 3 answers.";
  }

  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  if (correctCount !== 1) {
    return "Each question must contain exactly 1 correct answer.";
  }

  return null;
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function q(categoryName, pointValue, text, correct, wrong1, wrong2) {
  return {
    categoryName,
    pointValue,
    text,
    answers: [
      { answerText: correct, isCorrect: true },
      { answerText: wrong1, isCorrect: false },
      { answerText: wrong2, isCorrect: false },
    ],
  };
}
