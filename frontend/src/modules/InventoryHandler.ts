import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { SCREEN_SIZE } from "../etc/const";
import { ResourceMin, UpdateInventoryEvent, UpdateInventoryItemEvent } from "../events/events";
import { IItem, Item } from "../types/item";
import { getTextureFromResourceType, itemTextures } from "./ResourceHandler";


export interface InventoryResource {
    resourceType: string
    quantity: number
}

class InventoryHandler {
    container: Container

    resources: InventoryResource[]
    items: Item[]

    ws: WebSocket

    constructor(ws: WebSocket) {
        this.ws = ws
        this.resources = []
        this.container = new Container()
        this.container.position.set(0, SCREEN_SIZE - 100)
    }

    addBackground() {
        const background = new Graphics();
        background.beginFill(0xcccccc);
        background.drawRect(0, 0, SCREEN_SIZE, 100);
        background.endFill();
        this.container.addChild(background)
    }

    init(resources: ResourceMin[], items: IItem[]) {
        resources.forEach(r => {
            this.addResource(r)
        })

        this.items = items.map(i => {
            const item = new Item(i, this.ws, true)
            return item
        })

        this.render()
    }

    private addResource(resource: ResourceMin, remove: boolean = false) {
        const { resourceType, quantity } = resource

        // resource exists
        const existingItem = this.resources.find(item => item.resourceType == resourceType)

        if (existingItem) {
            if (remove) {
                existingItem.quantity -= quantity
            } else {
                existingItem.quantity += quantity
            }

            this.resources = this.resources.filter(i => i.resourceType != resourceType)
            this.resources.push(existingItem)

            this.resources = this.resources.filter(i => i.quantity > 0)
        } else {
            if (remove) {
                console.error("Tried to remove an item that does not exist in the inventory!")
                return
            }

            // new resourece -> add entrys
            const newItem: InventoryResource = {
                resourceType,
                quantity,
            }
            this.resources.push(newItem)
        }
    }

    render() {
        // remove all children and rerender items
        while (this.container.children[0]) {
            this.container.removeChild(this.container.children[0]);
        }

        this.resources.sort((a, b) => a.quantity > b.quantity ? -1 : 0)

        // render new inventory state

        this.addBackground()
        this.resources.forEach((resource, ix) => {
            const texture: Texture = getTextureFromResourceType(resource.resourceType)

            const container = new Container()
            container.position.set(ix * 40, 0)
            const sprite = new Sprite(texture)
            container.addChild(sprite)
            const text = new Text(`${resource.quantity}`, {
                fontFamily: 'Arial Black', fontSize: 14, fill: 0x000000, align: 'center' // 0x484f54
            });
            text.position.set(5, 30)
            container.addChild(text)

            this.container.addChild(container)
        })

        this.items.forEach((item, ix) => {
            item.container.position.set(10 + ix * 50, 55)
            this.container.addChild(item.container)
        })
    }

    // add; update; remove if 0
    handleUpdateInventoryEvent(event: UpdateInventoryEvent) {
        this.addResource(event.resource, event.remove)
        this.render()
    }

    handleUpdateInventoryItemEvent(event: UpdateInventoryItemEvent) {
        this.addItem(event)
        this.render()
    }

    private addItem(event: UpdateInventoryItemEvent) {
        if (event.remove) {
            this.items = this.items.filter(i => i.raw.uuid !== event.item.uuid)
        } else {
            this.items.push(new Item(event.item, this.ws, true))
        }
    }
}


export default InventoryHandler