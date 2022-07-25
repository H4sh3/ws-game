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
            const item = new Item(eItem, this.ws, false)

            this.items.push(item)

            this.container.addChild(item.container)
        })
    }

    removeItemsInCell(gridCellKey: string) {
        const toRemove = this.items.filter(i => `${i.raw.gridCellPos.x}#${i.raw.gridCellPos.y}` == gridCellKey)

        toRemove.forEach(i => {
            i.container.destroy()
            i.container.children.forEach(c => c.destroy())
            this.container.removeChild(i.container)
        })

        this.items = this.items.filter(i => !toRemove.includes(i))
    }

    removeItem(uuid: string) {
        const item = this.items.find(i => i.raw.uuid == uuid)
        if (!item) return

        // remove sprite from container; beeing rendered
        this.container.removeChild(item.container)

        // remove item
        this.items = this.items.filter(i => i.raw.uuid !== uuid)
    }
}

export default ItemHandler