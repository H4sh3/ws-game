import { Container } from "pixi.js"
import { ItemPositionsEvent } from "../events/events"
import { Item } from "../types/item"

class ItemHandler {

    items: Item[]
    container: Container

    // remove single item -> loot etc.

    // remove many items -> unsub from cell

    constructor() {
        this.items = []
        this.container = new Container()
    }

    handleItemPositionsEvent(event: ItemPositionsEvent) {
        event.items.forEach(iitem => {
            const item = new Item(iitem)

            this.container.addChild(item.container)

            this.items.push(item)
        })
    }

    removeItem(uuid: string) {
        const item = this.items.find(i => i.uuid)
        if (!item) return

        // remove sprite from container; beeing rendered
        this.container.removeChild(item.container)

        // remove item reference
        this.items = this.items.filter(i => i.uuid !== uuid)
    }
}

export default ItemHandler