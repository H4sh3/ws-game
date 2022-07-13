import { Container } from "pixi.js"
import { ItemPositionsEvent } from "../events/events"
import { Item } from "../types/item"

class ItemHandler {

    ws: WebSocket
    items: Item[]
    container: Container

    // remove single item -> loot etc.

    // remove many items -> unsub from cell

    constructor(ws: WebSocket) {
        this.ws = ws
        this.items = []
        this.container = new Container()
    }

    handleItemPositionsEvent(event: ItemPositionsEvent) {
        event.items.forEach(eItem => {
            const item = new Item(eItem, this.ws)

            this.items.push(item)

            this.container.addChild(item.container)
        })
    }


    removeItem(uuid: string) {
        const item = this.items.find(i => i.uuid == uuid)
        if (!item) return

        // remove sprite from container; beeing rendered
        this.container.removeChild(item.container)

        // remove item
        this.items = this.items.filter(i => i.uuid !== uuid)
    }
}

export default ItemHandler