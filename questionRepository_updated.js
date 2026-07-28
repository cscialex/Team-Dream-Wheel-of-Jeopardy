import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * SS-03 Question Repository Subsystem.
 *
 * This class is the data-tier facade used by the backend/game logic.
 * It wraps SQLite and exposes the repository calls from the SRS:
 *   - getAllCategories()
 *   - getQuestionsByCategory(categoryId, roundNumber?)
 *   - getQuestionById(questionId)
 *   - validateRepository()
 *
 * The repository now supports two rounds by storing a round_number on each
 * question. Point values are stored as base values 100/200/300/400/500.
 * The Game Logic subsystem should still apply Round 2 doubling when scoring.
 */
export default class QuestionRepository {
  constructor(dbPath = process.env.WOJ_DB_PATH ?? path.resolve(process.cwd(), "database/woj_questions.db")) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("foreign_keys = ON");
    this.initializeSchema();
    this.migrateSchema();
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
        round_number INTEGER NOT NULL DEFAULT 1 CHECK (round_number IN (1, 2)),
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
   * If an older local database already exists, it may not have round_number.
   * This migration adds the column without deleting existing questions.
   * Existing questions become Round 1 questions by default.
   */
  migrateSchema() {
    const columns = this.db.prepare("PRAGMA table_info(question)").all();
    const hasRoundNumber = columns.some((column) => column.name === "round_number");

    if (!hasRoundNumber) {
      this.db.exec(`
        ALTER TABLE question
        ADD COLUMN round_number INTEGER NOT NULL DEFAULT 1 CHECK (round_number IN (1, 2));
      `);
    }
  }

  /**
   * Adds sample data only when needed.
   * Safe to call every time the backend starts.
   *
   * If an older database already has Round 1 questions, this method only
   * adds missing Round 2 seed questions.
   */
  seedIfEmpty() {
    this.seedCategoriesIfMissing();
    this.seedQuestionsForRoundIfMissing(1, getRoundOneSeedQuestions());
    this.seedQuestionsForRoundIfMissing(2, getRoundTwoSeedQuestions());
  }

  seedCategoriesIfMissing() {
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
  }

  seedQuestionsForRoundIfMissing(roundNumber, seedQuestions) {
    const existing = this.db.prepare(`
      SELECT COUNT(*) AS count
      FROM question
      WHERE round_number = ?
    `).get(roundNumber);

    if (existing.count > 0) return;

    const categoryRows = this.getAllCategories();
    const categoryIdByName = new Map(categoryRows.map((category) => [category.categoryName, category.categoryId]));

    for (const item of seedQuestions) {
      const categoryId = categoryIdByName.get(item.categoryName);
      if (categoryId === undefined) {
        throw new Error(`Missing seed category: ${item.categoryName}`);
      }

      this.createQuestion(
        categoryId,
        item.pointValue,
        item.text,
        item.answers,
        "plain",
        item.roundNumber
      );
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

  /**
   * If roundNumber is supplied, only returns questions for that round.
   * If it is omitted, returns questions for all rounds.
   */
  getQuestionsByCategory(categoryId, roundNumber = null) {
    const rows = roundNumber === null
      ? this.db.prepare(`
          SELECT question_id, category_id, round_number, point_value, question_text, question_type
          FROM question
          WHERE category_id = ?
          ORDER BY RANDOM()
        `).all(categoryId)
      : this.db.prepare(`
          SELECT question_id, category_id, round_number, point_value, question_text, question_type
          FROM question
          WHERE category_id = ? AND round_number = ?
          ORDER BY RANDOM()
        `).all(categoryId, roundNumber);

    return rows.map((row) => this.buildQuestion(row));
  }

  getQuestionById(questionId) {
    const row = this.db.prepare(`
      SELECT question_id, category_id, round_number, point_value, question_text, question_type
      FROM question
      WHERE question_id = ?
    `).get(questionId);

    return row ? this.buildQuestion(row) : null;
  }

  /**
   * Gets a random unanswered candidate for a category, round, and base point value.
   *
   * Important: pointValue should be the base board value: 100/200/300/400/500.
   * The Game Logic subsystem should double scoring/display for Round 2.
   */
  getQuestionForCategoryAndValue(categoryId, pointValue, roundNumber = null) {
    const row = roundNumber === null
      ? this.db.prepare(`
          SELECT question_id, category_id, round_number, point_value, question_text, question_type
          FROM question
          WHERE category_id = ? AND point_value = ?
          ORDER BY RANDOM()
          LIMIT 1
        `).get(categoryId, pointValue)
      : this.db.prepare(`
          SELECT question_id, category_id, round_number, point_value, question_text, question_type
          FROM question
          WHERE category_id = ? AND point_value = ? AND round_number = ?
          ORDER BY RANDOM()
          LIMIT 1
        `).get(categoryId, pointValue, roundNumber);

    return row ? this.buildQuestion(row) : null;
  }

  /**
   * Convenience method for the current frontend, which sends a row index.
   * rowIndex 0..4 maps to point values 100..500.
   */
  getQuestionForCategoryAndRow(categoryId, roundNumber, rowIndex) {
    const baseValues = [100, 200, 300, 400, 500];
    const pointValue = baseValues[rowIndex];

    if (pointValue === undefined) {
      return null;
    }

    return this.getQuestionForCategoryAndValue(categoryId, pointValue, roundNumber);
  }

  validateRepository() {
    const errors = [];

    const categoryCount = this.db.prepare("SELECT COUNT(*) AS count FROM category").get();
    if (categoryCount.count < 6) {
      errors.push("Repository must contain at least 6 categories.");
    }

    const categories = this.getAllCategories();
    for (const category of categories) {
      for (const roundNumber of [1, 2]) {
        const questionCount = this.db.prepare(`
          SELECT COUNT(*) AS count
          FROM question
          WHERE category_id = ? AND round_number = ?
        `).get(category.categoryId, roundNumber);

        if (questionCount.count < 5) {
          errors.push(`Category '${category.categoryName}' must contain at least 5 Round ${roundNumber} questions.`);
        }
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

  /**
   * Backward-compatible createQuestion signature:
   *   createQuestion(categoryId, pointValue, text, answers, questionType?, roundNumber?)
   *
   * Old code that does not pass roundNumber will create Round 1 questions.
   */
  createQuestion(categoryId, pointValue, text, answers, questionType = "plain", roundNumber = 1) {
    const validationError = validateQuestionInputs(roundNumber, pointValue, answers);
    if (validationError) return { success: false, error: validationError };

    const tx = this.db.transaction(() => {
      const result = this.db.prepare(`
        INSERT INTO question (category_id, round_number, point_value, question_text, question_type)
        VALUES (?, ?, ?, ?, ?)
      `).run(categoryId, roundNumber, pointValue, text, questionType);

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

  /**
   * Backward-compatible updateQuestion signature:
   *   updateQuestion(questionId, categoryId, pointValue, text, answers, questionType?, roundNumber?)
   */
  updateQuestion(questionId, categoryId, pointValue, text, answers, questionType = "plain", roundNumber = 1) {
    const validationError = validateQuestionInputs(roundNumber, pointValue, answers);
    if (validationError) return { success: false, error: validationError };

    const tx = this.db.transaction(() => {
      const update = this.db.prepare(`
        UPDATE question
        SET category_id = ?, round_number = ?, point_value = ?, question_text = ?, question_type = ?
        WHERE question_id = ?
      `).run(categoryId, roundNumber, pointValue, text, questionType, questionId);

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
      roundNumber: row.round_number,
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

function validateQuestionInputs(roundNumber, pointValue, answers) {
  if (![1, 2].includes(roundNumber)) {
    return "roundNumber must be either 1 or 2.";
  }

  if (![100, 200, 300, 400, 500].includes(pointValue)) {
    return "pointValue must be one of 100, 200, 300, 400, or 500.";
  }

  return validateAnswers(answers);
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

function q(categoryName, roundNumber, pointValue, text, correct, wrong1, wrong2) {
  return {
    categoryName,
    roundNumber,
    pointValue,
    text,
    answers: [
      { answerText: correct, isCorrect: true },
      { answerText: wrong1, isCorrect: false },
      { answerText: wrong2, isCorrect: false },
    ],
  };
}

function getRoundOneSeedQuestions() {
  return [
    // Science
    q("Science", 1, 100, "What planet is known as the Red Planet?", "Mars", "Venus", "Jupiter"),
    q("Science", 1, 200, "What gas do humans need to breathe?", "Oxygen", "Helium", "Carbon dioxide"),
    q("Science", 1, 300, "What force pulls objects toward Earth?", "Gravity", "Magnetism", "Friction"),
    q("Science", 1, 400, "What is H2O commonly known as?", "Water", "Salt", "Hydrogen"),
    q("Science", 1, 500, "What part of the cell contains DNA?", "Nucleus", "Ribosome", "Cell wall"),

    // History
    q("History", 1, 100, "Who was the first president of the United States?", "George Washington", "Thomas Jefferson", "Abraham Lincoln"),
    q("History", 1, 200, "In what year did World War II end?", "1945", "1918", "1963"),
    q("History", 1, 300, "Which ancient civilization built the pyramids at Giza?", "Egyptians", "Romans", "Greeks"),
    q("History", 1, 400, "The Declaration of Independence was signed in what year?", "1776", "1789", "1812"),
    q("History", 1, 500, "Who led the civil rights March on Washington in 1963?", "Martin Luther King Jr.", "Frederick Douglass", "Booker T. Washington"),

    // Movies & TV
    q("Movies & TV", 1, 100, "What movie features the character Simba?", "The Lion King", "Toy Story", "Finding Nemo"),
    q("Movies & TV", 1, 200, "What streaming series is set in Hawkins, Indiana?", "Stranger Things", "The Office", "Friends"),
    q("Movies & TV", 1, 300, "Who directed Jurassic Park?", "Steven Spielberg", "James Cameron", "Christopher Nolan"),
    q("Movies & TV", 1, 400, "What movie series features the One Ring?", "The Lord of the Rings", "Harry Potter", "Star Wars"),
    q("Movies & TV", 1, 500, "What fictional school does Harry Potter attend?", "Hogwarts", "Xavier's School", "Starfleet Academy"),

    // Geography
    q("Geography", 1, 100, "What is the capital of France?", "Paris", "Madrid", "Rome"),
    q("Geography", 1, 200, "Which ocean is the largest?", "Pacific Ocean", "Atlantic Ocean", "Indian Ocean"),
    q("Geography", 1, 300, "What country is home to the city of Kyoto?", "Japan", "China", "Thailand"),
    q("Geography", 1, 400, "What is the longest river in the world?", "Nile River", "Amazon River", "Mississippi River"),
    q("Geography", 1, 500, "Mount Everest lies in which mountain range?", "Himalayas", "Andes", "Rockies"),

    // Sports
    q("Sports", 1, 100, "How many points is a touchdown worth in American football?", "6", "3", "7"),
    q("Sports", 1, 200, "How many players are on the court for one basketball team?", "5", "6", "9"),
    q("Sports", 1, 300, "What sport uses the terms love, deuce, and ace?", "Tennis", "Golf", "Baseball"),
    q("Sports", 1, 400, "How many bases are on a baseball field?", "4", "3", "5"),
    q("Sports", 1, 500, "What international event awards gold, silver, and bronze medals?", "The Olympics", "The World Series", "The Super Bowl"),

    // Music
    q("Music", 1, 100, "How many strings does a standard guitar have?", "6", "4", "8"),
    q("Music", 1, 200, "What instrument has black and white keys?", "Piano", "Violin", "Trumpet"),
    q("Music", 1, 300, "What does BPM measure in music?", "Tempo", "Volume", "Pitch"),
    q("Music", 1, 400, "Which family of instruments includes the flute and clarinet?", "Woodwinds", "Percussion", "Strings"),
    q("Music", 1, 500, "What symbol indicates the pitch of written music at the start of a staff?", "Clef", "Rest", "Bar line"),
  ];
}

function getRoundTwoSeedQuestions() {
  return [
    // Science
    q("Science", 2, 100, "What is the chemical symbol for gold?", "Au", "Ag", "Fe"),
    q("Science", 2, 200, "What organ pumps blood through the human body?", "Heart", "Liver", "Lung"),
    q("Science", 2, 300, "What process do plants use to make food from sunlight?", "Photosynthesis", "Evaporation", "Condensation"),
    q("Science", 2, 400, "What is the center of an atom called?", "Nucleus", "Electron cloud", "Molecule"),
    q("Science", 2, 500, "What scale is used to measure earthquake magnitude?", "Richter scale", "Beaufort scale", "pH scale"),

    // History
    q("History", 2, 100, "Who was the first emperor of Rome?", "Augustus", "Julius Caesar", "Nero"),
    q("History", 2, 200, "Which war was fought between the North and South regions of the United States?", "The Civil War", "The Revolutionary War", "The War of 1812"),
    q("History", 2, 300, "What wall divided Berlin during the Cold War?", "The Berlin Wall", "Hadrian's Wall", "The Great Wall"),
    q("History", 2, 400, "Who was the British prime minister during much of World War II?", "Winston Churchill", "Neville Chamberlain", "Tony Blair"),
    q("History", 2, 500, "Which empire was ruled by Genghis Khan?", "Mongol Empire", "Ottoman Empire", "Roman Empire"),

    // Movies & TV
    q("Movies & TV", 2, 100, "What movie features a young wizard named Harry?", "Harry Potter and the Sorcerer's Stone", "The Matrix", "Avatar"),
    q("Movies & TV", 2, 200, "What TV show features a coffee shop called Central Perk?", "Friends", "Seinfeld", "The Big Bang Theory"),
    q("Movies & TV", 2, 300, "What superhero is also known as the Dark Knight?", "Batman", "Spider-Man", "Iron Man"),
    q("Movies & TV", 2, 400, "What movie franchise features lightsabers and the Force?", "Star Wars", "Indiana Jones", "The Hunger Games"),
    q("Movies & TV", 2, 500, "What animated movie features Elsa and Anna?", "Frozen", "Moana", "Brave"),

    // Geography
    q("Geography", 2, 100, "What is the capital of Japan?", "Tokyo", "Seoul", "Beijing"),
    q("Geography", 2, 200, "Which continent is the Sahara Desert located on?", "Africa", "Asia", "Australia"),
    q("Geography", 2, 300, "What is the largest country by land area?", "Russia", "Canada", "China"),
    q("Geography", 2, 400, "What country contains the Great Barrier Reef?", "Australia", "New Zealand", "Indonesia"),
    q("Geography", 2, 500, "What is the capital of Canada?", "Ottawa", "Toronto", "Vancouver"),

    // Sports
    q("Sports", 2, 100, "What sport is played at Wimbledon?", "Tennis", "Soccer", "Cricket"),
    q("Sports", 2, 200, "In soccer, what body part cannot an outfield player use to touch the ball?", "Hands", "Head", "Feet"),
    q("Sports", 2, 300, "How many innings are in a standard professional baseball game?", "9", "7", "11"),
    q("Sports", 2, 400, "What sport is associated with the Stanley Cup?", "Hockey", "Basketball", "Football"),
    q("Sports", 2, 500, "What is the name of the championship game in the NFL?", "Super Bowl", "World Cup", "Final Four"),

    // Music
    q("Music", 2, 100, "What instrument is commonly associated with a drum kit?", "Snare drum", "Cello", "Saxophone"),
    q("Music", 2, 200, "What is the highest female singing voice?", "Soprano", "Alto", "Tenor"),
    q("Music", 2, 300, "How many beats does a quarter note usually receive in 4/4 time?", "1", "2", "4"),
    q("Music", 2, 400, "What genre is associated with improvisation and swing rhythms?", "Jazz", "Opera", "Punk"),
    q("Music", 2, 500, "What device keeps a steady tempo for musicians?", "Metronome", "Tuner", "Amplifier"),
  ];
}
