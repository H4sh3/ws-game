import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { SCREEN_SIZE } from "../etc/const";
import { IResource, ResourceMin, UpdateInventoryEvent } from "../events/events";
import { itemTextures } from "../types/resource";


export interface InventoryItem {
    resourceType: string
    quantity: number
}

class InventoryHandler {
    container: Container

    inventoryItems: InventoryItem[]

    constructor() {
        this.inventoryItems = []
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

    init(resources: ResourceMin[]) {
        resources.forEach(r => {
            this.addItem(r)
        })
        this.render()
    }

    addItem(resource: ResourceMin, remove: boolean = false) {
        const { resourceType, quantity } = resource

        // resource exists
        const existingItem = this.inventoryItems.find(item => item.resourceType == resourceType)

        if (existingItem) {
            if (remove) {
                existingItem.quantity -= quantity
            } else {
                existingItem.quantity += quantity
            }

            this.inventoryItems = this.inventoryItems.filter(i => i.resourceType != resourceType)
            this.inventoryItems.push(existingItem)

            this.inventoryItems = this.inventoryItems.filter(i => i.quantity > 0)
        } else {
            if (remove) {
                console.error("Tried to remove an item that does not exist in the inventory!")
                return
            }

            // new resourece -> add entrys
            const newItem: InventoryItem = {
                resourceType,
                quantity,
            }
            this.inventoryItems.push(newItem)
        }
    }

    render() {
        // remove all children and rerender items
        while (this.container.children[0]) {
            this.container.removeChild(this.container.children[0]);
        }

        this.inventoryItems.sort((a, b) => a.quantity > b.quantity ? -1 : 0)

        // render new inventory state

        this.addBackground()
        this.inventoryItems.forEach((item, ix) => {
            console.log(item)
            let texture: Texture;
            if (item.resourceType == "log") {
                texture = itemTextures.log
            } else if (item.resourceType == "brick") {
                texture = itemTextures.brick
            } else if (item.resourceType == "ironOre") {
                texture = itemTextures.ironOre
            } else {
                // todo add more item types
                texture = itemTextures.brick
            }


            const container = new Container()
            container.position.set(ix * 40, 0)
            const sprite = new Sprite(texture)
            container.addChild(sprite)
            const text = new Text(`${item.quantity}`, {
                fontFamily: 'Arial Black', fontSize: 14, fill: 0x000000, align: 'center' // 0x484f54
            });
            text.position.set(5, 30)
            container.addChild(text)

            this.container.addChild(container)
        })
    }

    // add; update; remove if 0
    updateItem(event: UpdateInventoryEvent) {

        this.addItem(event.resource, event.remove)
        this.render()

    }
}

export default InventoryHandler