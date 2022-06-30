import { makeObservable, observable, computed, action } from "mobx"


export interface Item {
    resourceType: string
    quantity: number
}

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

const getRecipeBook = (): Map<string, Recipe> => {
    const recipes = new Map<string, Recipe>()
    const blockadeRecipe: Recipe = {
        ingredients: [
            {
                resourceType: "brick",
                amount: 5
            }
        ],
        buildResourceType: "blockade"
    }
    recipes.set(blockadeRecipe.buildResourceType, blockadeRecipe)
    return recipes
}
export class InventoryStore {
    items: Map<string, Item>
    recipes: Map<string, Recipe>
    selectedItems: string[]
    selectedRecipe: Recipe

    constructor() {
        makeObservable(this, {
            items: observable,
            getItems: computed,
            addItem: action,
            itemBuild: action,
            selectedItems: observable,
            itemClicked: action,
            selectedRecipe: observable,
            recipeClicked: action,
            recipes: observable,
            getRecipes: computed,
            unselectRecipe: action
        })
        this.selectedRecipe = UnselectedRecipe
        this.items = new Map()
        this.recipes = getRecipeBook()
        this.selectedItems = []
    }

    addItem(i: Item) {
        const { resourceType } = i;
        if (this.items.has(resourceType)) {
            const x = this.items.get(resourceType)
            x.quantity += i.quantity
            this.items.set(resourceType, x)
        } else {
            this.items.set(resourceType, i)
        }
    }

    itemBuild(i: Item) {
        const { resourceType } = i;

        const recipe = this.recipes.get(resourceType)

        if (this.canBuildResource(recipe)) {
            this.removeResourcesFor(recipe)
        }

    }

    get getItems(): Item[] {
        const items: Item[] = []

        this.items.forEach(i => {
            items.push(i)
        })

        return items
    }

    itemClicked(resourceType: string) {
        if (this.selectedItems.includes(resourceType)) {
            this.selectedItems = this.selectedItems.filter(i => i !== resourceType)
        } else {
            this.selectedItems.push(resourceType)
        }
    }

    recipeClicked(resourceType: string) {
        if (this.selectedRecipe.buildResourceType == resourceType) {
            this.selectedRecipe = UnselectedRecipe
        } else {
            this.selectedRecipe = this.recipes.get(resourceType)
            console.log(this.selectedRecipe)
        }
    }

    canBuildResource(recipe: Recipe): boolean {
        return recipe.ingredients.every(ingredient => {
            const { amount, resourceType } = ingredient
            return this.items.get(resourceType).quantity >= amount
        })
    }

    removeResourcesFor(recipe: Recipe) {
        recipe.ingredients.forEach(ingredient => {
            const { amount, resourceType } = ingredient
            const inventoryItem = this.items.get(resourceType)
            inventoryItem.quantity -= amount
            this.items.set(resourceType, inventoryItem)
        })
    }

    get getRecipes(): Recipe[] {
        const recipes: Recipe[] = []

        this.recipes.forEach(i => {
            recipes.push(i)
        })

        return recipes
    }

    unselectRecipe() {
        this.selectedRecipe = UnselectedRecipe
    }
}