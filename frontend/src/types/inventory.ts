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
            const recipes = [
                {
                    "t": "blockade",
                    "r": "brick",
                    "price": 5
                }
            ]
            const recipe = recipes.find(i => i.t === rT)
            const item = this.items.get(recipe.r)
            if (!item) {
                console.error(`Need ${recipe.price}x${recipe.r} to build ${recipe.t}`)
            } else if (item.quantity < recipe.price) {
                console.error(`Need ${recipe.price}x${recipe.r} got ${item.quantity}`)
            } else {
                console.log("build ok")
                item.quantity -= recipe.price
                this.items.set(recipe.r, item)
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