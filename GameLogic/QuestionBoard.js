import BoardCell from './BoardCell'
import Question from './Question';

export default class QuestionBoard
{
    cells = [];
    cats = [];
    categoryIndices;

    index = 0;

    constructor(categories, round)
    {
        this.cats = categories;
        
        categories.foreach((c) => {
            categoryIndices[c] = index;
            index = index + 1;
        });

        for(i = 0; i < categories.length; i++)
        {
            curCategory = categories[i];
            
            categoryIndices[curCategory] = i;

            for(j = 0; j < 5; j++) // TODO - turn 5 into constant so that we can dynamically set this in the future (e.g., more than 5 q per cat)
            {
                question = new Question();
                cells[i][j] = new BoardCell(question, round);
            }
        }
    }

    markAnswered(categoryId, pointValue)
    {
        cIx = categoryIndices[categoryId];
        bc = cells[cIx][pointValue];
        bc.answered = true;
    }

    availableValues(categoryId)
    {
        cIx = this.categoryIndices[categoryId];
        availVals = [];
        availIx = 0;
        
        for(j = 0; j < 5; j++) // loop through all questions for given category
        {
            bc = this.cells[cIx][j];
            if(bc.answered == false){
                availVals[availIx] = bc.pointValue;
            }
        }

        return availVals;
    }

    isCategoryExhausted(categoryId)
    {
        return (this.availableValues(categoryId).length == 0);
    }

    allCellsAnswered()
    {
        for(i = 0; i < this.categoryIndices.length; i++)
        {
            for(j=0; j < 5; j++)
            {
                if(this.cells[i][j].answered == false)
                {
                    return false;
                }
            }
        }

        return true;
    }

    questionAt(categoryId, pointValueIndex)
    {
        cIx = this.categoryIndices[categoryId];
        return this.cells[cIx][pointValueIndex].question;
    }
}