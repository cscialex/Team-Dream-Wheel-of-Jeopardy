export default class BoardCell
{
    pointValue;
    answered;
    question;

    constructor(q, round)
    {
        this.question = q;
        this.pointValue = q.pointValue * round;
        this.answered = false;
    }
}