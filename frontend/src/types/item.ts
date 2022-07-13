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
    gridCellPos: IVector
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
    gridCellPos: IVector
    pos: Vector
    container: Container
    uuid: string
    ws: WebSocket
    sprite: Sprite


    constructor(rawItem: IItem, ws: WebSocket) {
        this.gridCellPos = rawItem.gridCellPos
        this.ws = ws
        this.pos = createVector(rawItem.pos.x, rawItem.pos.y)
        this.uuid = rawItem.uuid

        this.sprite = new Sprite(getTextureFromResourceType(rawItem.itemSubType)) // shows only a blob
        this.sprite.interactive = true

        this.sprite.on("click", () => {
            ws.send(getPlayerClickedItemEvent(this.uuid, this.gridCellPos))
        })

        this.container = new Container()
        this.container.addChild(this.sprite)
        this.container.position.set(this.pos.x, this.pos.y)
    }


}