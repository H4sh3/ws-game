import { Container, Sprite } from "pixi.js"
import { createVector, getPlayerClickedItemEvent } from "../events/events"
import { getTextureFromResourceType } from "../modules/ResourceHandler"
import Vector, { IVector } from "./vector"


export interface Boni {
    attribute: string
    value: number
}

// item interface from websocket -> on load
export interface IItem {

    itemType: string
    itemSubType: string
    pos: IVector
    uuid: string
    quantity: number

    rarity: string
    quality: number
    minDamage: number
    maxDamage: number
    absorb: number
    attackSpeed: number

    boni: Boni[]
}

// item object used in client for visualization with pixijs sprites
export class Item {
    pos: Vector
    container: Container
    uuid: string
    ws: WebSocket


    constructor(rawItem: IItem, ws: WebSocket) {
        this.ws = ws
        this.pos = createVector(rawItem.pos.x, rawItem.pos.y)
        this.uuid = rawItem.uuid
        this.container = new Container()
        this.container.position.set(this.pos.x, this.pos.y)

        const sprite = new Sprite(getTextureFromResourceType(rawItem.itemSubType)) // shows only a blob
        sprite.interactive = true
        sprite.on("click", () => {
            ws.send(getPlayerClickedItemEvent(this.uuid))
        })

        this.container.addChild(sprite)
    }


}