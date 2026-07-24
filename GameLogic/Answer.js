export default class Answer
{
    answerId = 0;
    answerText = "";
    isCorrect = false;

    constructor(aId, text, corr)
    {
        this.answerId = aId;
        this.answerText = text;
        this.isCorrect = corr;
    }
}