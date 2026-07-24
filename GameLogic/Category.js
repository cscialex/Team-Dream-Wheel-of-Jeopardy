export default class Category
{
    categoryId;
    categoryName;
    description;

    constructor(cId, cName, desc)
    {
        this.categoryId = cId;
        this.categoryName = cName;
        this.description = desc;
    }
}