const QuestionType = Object.freeze({
    PLAIN: 0,
    IMAGE: 1,
    AUDIO: 2,
    VIDEO: 3
});

export default class Question
{
    questionId;
    categoryId;
    pointValue;
    questionText;
    questionType;
    answers;

    constructor(qId, cId, value, text, type, ans)
    {
        this.questionId = qId;
        this.categoryId = cId;
        this.pointValue = value;
        this.questionText = text;
        this.questionType = type;
        this.answers = ans; // size of 3
    }

    correctAnswer()
    {
        this.answers.forEach((val) => 
        {
            if(val.isCorrect)
            {
                return val;
            }
        });

        return null;
    }

    answeredCorrectly(answerId)
    {
        return this.answers[answerId].isCorrect;
    }
}