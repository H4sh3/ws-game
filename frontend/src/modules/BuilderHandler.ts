import { Container, Graphics, Loader, Sprite } from "pixi.js";
import { itemTextures } from "./ResourceHandler";

interface Ingredient {
    resourceType: string
    amount: number
}

interface Recipe {
    ingredients: Ingredient[],
    buildResourceType: string,
}

const UnselectedRecipe: Recipe = {
    ingredients: [],
    buildResourceType: ""
}

// Todo: get this from backend
const getRecipeBook = (): Recipe[] => {

    const blockadeRecipe: Recipe = {
        ingredients: [
            {
                resourceType: "brick",
                amount: 5
            }
        ],
        buildResourceType: "blockade"
    }

    return [
        blockadeRecipe,
    ]
}

class BuilderHandler {
    container: Container;
    toggleButton: Sprite;
    selectedBuildResourceType: string
    recipes: Recipe[]

    constructor(loader: Loader) {

        this.recipes = getRecipeBook()

        this.container = new Container()
        this.container.position.set(30, 30)



        const background = new Graphics();
        background.beginFill(0xcccccc);
        background.drawRect(0, 0, 200, 400);
        background.endFill();
        this.container.addChild(background)

        const closeButton = new Sprite(itemTextures.button)
        closeButton.position.set(170, -10)
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

        // add recipes to container
        this.recipes.forEach((r, i) => {
            if (r.buildResourceType == "blockade") {
                const rContainer = new Container()

                const rBackground = new Graphics();
                rBackground.beginFill(0x00ff00);
                rBackground.drawRect(0, 0, 70, 70);
                rBackground.endFill();
                rBackground.visible = false

                rContainer.addChild(rBackground)

                const sprite = new Sprite(loader.resources['assets/blockade.png'].texture)
                sprite.position.set(10, (10 * (i + 1)) + (i * 50))
                sprite.interactive = true

                sprite.on("click", () => {
                    if (this.selectedBuildResourceType == r.buildResourceType) {
                        this.selectedBuildResourceType = ""
                        rBackground.visible = false
                    } else {
                        this.selectedBuildResourceType = r.buildResourceType
                        rBackground.visible = true
                    }
                })
                rContainer.addChild(sprite)

                this.container.addChild(rContainer)
            }
        })
    }

    toggle() {
        this.container.visible = !this.container.visible
    }


}

export default BuilderHandler