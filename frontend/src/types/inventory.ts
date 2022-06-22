import { Loader } from "pixi.js"
import { createVector, Hitpoints, IResource } from "../events/events"
import { Player } from "./player"
import { Resource } from "./resource"

export class Inventory {
    items: Map<string, Resource>

    constructor() {
        this.items = new Map()
    }

    initLoad(items: { [key: string]: IResource }, player: Player, loader: Loader, ws: WebSocket) {
        Object.keys(items).forEach(k => {

            const x = items[k]
            const hp: Hitpoints = {
                current: 0,
                max: 0
            }
            const r: Resource = new Resource(x.id, player, x.quantity, x.resourceType, createVector(x.pos.x, x.pos.y), hp, x.isSolid, loader, ws, false)

            this.items.set(k, r)
        })

        console.log(this.items.get("brick"))
    }
}