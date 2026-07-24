export default class Player
{
    playerName = "";
    round1Score;
    round2Score;
    tokenCount;

    constructor(n)
    {
        playerName = n;
        round1Score = 0;
        round2Score = 0;
        tokenCount = 0;
    }

    addPoints(round, v)
    {
        result = 0;

        if(round == 1)
        {
            this.round1Score = this.round1Score + v;
            result = 1;
        }
        else if(round == 2)
        {
            this.round2Score = this.round2Score + v;
            result = 1;
        }

        return result;
    }

    deductPoints(round, v)
    {
        result = 0;

        if(round == 1)
        {
            this.round1Score = this.round1Score - v;
            result = 1;
        }
        else if(round == 2)
        {
            this.round2Score = this.round2Score - v;
            result = 1;
        }

        return result;
    }

    resetRoundScore(r)
    {
        result = 0;

        if(r == 1)
        {
            this.round1Score = 0;
            result = 1;
        }
        else if(r == 2)
        {
            this.round2Score = 0;
            result = 1;
        }

        return result;
    }

    forfeitAllTokens()
    {
        this.tokenCount = 0;
    }

    grantToken()
    {
        this.tokenCount += 1;
    }

    redeemToken()
    {
        result = false;

        if(this.tokenCount > 0)
        {
            this.tokenCount = this.tokenCount - 1;
            result = true;
        }
        
        return result;
    }

    totalScore()
    {
        return this.round1Score + this.round2Score;
    }
}