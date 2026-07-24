const SectorCategory = Object.freeze({
    CATEGORY: 0,
    PLAYERS_CHOICE: 1,
    OPPONENTS_CHOICE: 2,
    FREE_SPIN: 3,
    LOSE_TURN: 4,
    BANKRUPT: 5
});

function randomInt(min, max)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default class Wheel
{
    sectors;

    constructor(selectedCategories)
    {
        // TODO - randomize init
        sectors = [ [selectedCategories[0], SectorCategory.CATEGORY],
                    [selectedCategories[1], SectorCategory.CATEGORY],
                    [selectedCategories[2], SectorCategory.CATEGORY],
                    [selectedCategories[3], SectorCategory.CATEGORY],
                    [selectedCategories[4], SectorCategory.CATEGORY],
                    [selectedCategories[5], SectorCategory.CATEGORY],
                    [null,                  SectorCategory.PLAYERS_CHOICE],
                    [null,                  SectorCategory.OPPONENTS_CHOICE],
                    [null,                  SectorCategory.FREE_SPIN],
                    [null,                  SectorCategory.LOSE_TURN],
                    [null,                  SectorCategory.BANKRUPT]];
    }

    spin()
    {
        return sectors[randomInt(0,10)];
    }
}