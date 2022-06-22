import { Loader } from "pixi.js"
import { createVector, Hitpoints, IResource, UpdateInventoryEvent } from "../events/events"
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

    update(event: UpdateInventoryEvent, player: Player, loader: Loader, ws: WebSocket) {
        const rT = event.item.resourceType
        if (event.remove) {
            // Todo: Map build resource to costs
            const prices = [
                {
                    "t": "blockade",
                    "r": "brick",
                    "price": 5
                }
            ]
            const costs = prices.find(i => i.t === rT)
            if (this.items.has(costs.r)) {
                const i = this.items.get(costs.r)
                i.quantity -= costs.price
                this.items.set(costs.r, i)
            } else {
                console.error("insufficient resources in inventory", rT, event.item.quantity)
            }
        } else {
            // add
            if (this.items.has(rT)) {
                const i = this.items.get(rT)
                i.quantity += event.item.quantity
                this.items.set(rT, i)
            } else {
                const x = event.item
                const hp: Hitpoints = {
                    current: 0,
                    max: 0
                }
                const r: Resource = new Resource(x.id, player, x.quantity, x.resourceType, createVector(x.pos.x, x.pos.y), hp, x.isSolid, loader, ws, false)
                this.items.set(rT, r)
            }
        }
    }

    log() {
        for (let k of this.items.keys()) {
            console.log(`${k}: ${this.items.get(k).quantity}`)
        }
    }
}