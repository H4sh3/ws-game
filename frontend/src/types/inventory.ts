import { Resource } from "./resource"

export class Inventory {
    items: Map<string, Resource>

    constructor() {
        this.items = new Map()
    }

    initLoad() {

    }
}