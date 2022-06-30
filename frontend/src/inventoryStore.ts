import { makeObservable, observable, computed, action, flow } from "mobx"


export interface Item {
    resourceType: string
    quantity: number
}

interface Recipe {
    spendResourceType: string, // Todo: add interface for resourceType
    buildResourceType: string,
    costs: number
}

const getRecipeBook = (): Map<string, Recipe> => {
    const recipes = new Map<string, Recipe>()
    recipes.set("blockade", {
        buildResourceType: "blockade",
        spendResourceType: "brick",
        costs: 5
    })
    return recipes
}

export class InventoryStore {
    items: Map<string, Item>
    recipes: Map<string, Recipe>
    selectedItem: string

    constructor() {
        makeObservable(this, {
            items: observable,
            addItem: action,
            removeItem: action,
            getItems: computed,
            selectedItem: observable,
            setSelectedItem: action,
        })
        this.items = new Map()
        this.recipes = getRecipeBook()
        this.selectedItem = ""
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

    removeItem(i: Item) {
        const { resourceType } = i;

        if (this.recipes.has(resourceType)) { // recipe exists
            const { spendResourceType, costs } = this.recipes.get(resourceType)
            // do we have resource that should be spend
            if (this.items.has(spendResourceType)) {
                const entry = this.items.get(spendResourceType)
                entry.quantity -= costs
                if (entry.quantity == 0) {
                    this.items.delete(spendResourceType)
                } else {
                    this.items.set(spendResourceType, entry)
                }
            }
        }
    }

    get getItems(): Item[] {
        const items: Item[] = []

        this.items.forEach(i => {
            items.push(i)
        })

        return items
    }

    setSelectedItem(resourceType: string) {
        this.selectedItem = resourceType
    }
}