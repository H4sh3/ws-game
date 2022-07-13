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
        event.items.forEach(iitem => {
            const item = new Item(iitem, this.ws)
            this.items.push(item)
            this.container.addChild(item.container)

        })
    }

    removeItem(uuid: string) {

        const item = this.items.find(i => i.uuid)
        if (!item) return
        console.log(`remove ${uuid}`)
        // remove item
        console.log(`items length ${this.items.length}`)
        this.items = this.items.filter(i => i.uuid !== uuid)
        console.log(`items length ${this.items.length}`)

        // remove sprite from container; beeing rendered
        this.container.removeChild(item.container)
        this.container.removeChild(item.sprite)
    }
}

export default ItemHandler