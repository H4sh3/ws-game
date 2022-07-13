import { Container, Graphics, Loader, Sprite, Text } from "pixi.js";
import { getTextureFromResourceType, itemTextures } from "./ResourceHandler";

interface Ingredient {
    resourceType: string
    amount: number
}

interface IRecipe {
    ingredients: Ingredient[],
    buildResourceType: string,
}

const borderSize = 5
class RecipeItem {
    lastYPosition: number

    container: Container
    background: Graphics
    active: boolean
    recipe: IRecipe

    constructor(previousUsedYPosition: number, recipe: IRecipe, builderHandler: BuilderHandler) {
        this.recipe = recipe
        this.active = false

        this.container = new Container()
        let internalY = 10
        this.container.position.set(10, previousUsedYPosition)

        this.background = new Graphics();
        this.background.beginFill(0x00ff00);
        this.background.drawRect(-5, -3, 40, 40);
        this.background.endFill();
        this.background.visible = this.active
        this.container.addChild(this.background)

        const sprite = new Sprite(getTextureFromResourceType(recipe.buildResourceType))
        sprite.interactive = true
        sprite.on("click", () => {
            // disables all before selecting a new recipe
            builderHandler.disableOtherRecipes(recipe.buildResourceType)
            if (builderHandler.selectedBuildResourceType == recipe.buildResourceType) {
                console.log("deselect!")
                builderHandler.selectedBuildResourceType = ""
                this.active = false
                this.background.visible = this.active
            } else {
                builderHandler.selectedBuildResourceType = recipe.buildResourceType
                builderHandler.selectedAt = Date.now()
                this.active = true
                this.background.visible = this.active
            }
        })
        this.container.addChild(sprite)

        // add texts with ingredients
        recipe.ingredients.forEach(ing => {
            const ingredientText = new Text(`${ing.resourceType} x ${ing.amount}`, { fontFamily: 'Arial Black', fontSize: 12, fill: 0x000000, align: 'center' });
            ingredientText.position.set(70, internalY)
            this.container.addChild(ingredientText)
            internalY += 15
        })

        internalY += 10
        const line = new Graphics();
        line.beginFill(0x4d4d4d);
        line.drawRect(-borderSize, internalY, 200 - (borderSize * 2), 2);
        line.endFill();
        this.container.addChild(line)
        internalY += 5

        this.lastYPosition = previousUsedYPosition + internalY
    }

    deactivate() {
        this.active = false
        this.background.visible = this.active
    }
}

// Todo: get this from backend
const getRecipeBook = (): IRecipe[] => {

    const blockadeRecipe: IRecipe = {
        ingredients: [
            {
                resourceType: "brick",
                amount: 5
            }
        ],
        buildResourceType: "blockade"
    }

    const woodBlockadeRecipe: IRecipe = {
        ingredients: [
            {
                resourceType: "log",
                amount: 5
            }
        ],
        buildResourceType: "woodBlockade"
    }

    return [
        blockadeRecipe,
        woodBlockadeRecipe,
    ]
}

class BuilderHandler {
    container: Container;
    toggleButton: Sprite;
    selectedBuildResourceType: string
    selectedAt: number
    recipes: IRecipe[]
    recipeItems: RecipeItem[]

    constructor() {
        this.selectedBuildResourceType = ""
        this.recipes = getRecipeBook()
        this.initLayout()

        // add recipes to container
        let previousUsedYPosition = 10
        this.recipeItems = this.recipes.map(r => {
            const recipeItem = new RecipeItem(previousUsedYPosition, r, this)
            this.container.addChild(recipeItem.container)
            previousUsedYPosition = recipeItem.lastYPosition
            return recipeItem
        })
    }

    disableOtherRecipes(selectedResourceType: string) {
        this.recipeItems.filter(r => r.recipe.buildResourceType !== selectedResourceType).forEach(r => {
            r.deactivate()
        })
    }

    initLayout() {
        this.container = new Container()
        this.container.visible = false
        this.container.position.set(30, 30)

        const background = new Graphics();
        background.beginFill(0x4d4d4d);
        background.drawRect(0, 0, 200, 400);
        background.endFill();
        this.container.addChild(background)

        const backgroundInfill = new Graphics();
        backgroundInfill.beginFill(0xBFBFBF);
        backgroundInfill.drawRect(borderSize, borderSize, 200 - (borderSize * 2), 400 - (borderSize * 2));
        backgroundInfill.endFill();
        this.container.addChild(backgroundInfill)

        const closeButton = new Sprite(itemTextures.button)
        closeButton.position.set(170 - borderSize, -2 + borderSize)
        closeButton.interactive = true
        closeButton.on("click", () => {
            this.toggle()
        })
        this.container.addChild(closeButton)

        this.toggleButton = new Sprite(itemTextures.builderIcon)
        this.toggleButton.interactive = true
        this.toggleButton.on("click", () => {
            this.toggle()
        })
    }

    toggle() {
        this.container.visible = !this.container.visible
    }


}

export default BuilderHandler