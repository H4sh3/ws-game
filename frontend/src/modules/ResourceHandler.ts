import { Container } from "pixi.js";
import { createVector, ResourcePositionsEvent, UpdateResourceEvent } from "../events/events";
import { Game } from "../main";
import { Player } from "../types/player";
import { Resource } from "../types/resource";

class ResourceHandler {
    // resources located in a gridcell
    resourceMap: Map<string, Resource[]>
    resourceArr: Resource[]
    container: Container


    constructor() {
        this.resourceMap = new Map()
        this.resourceArr = []
        this.container = new Container()
    }

    handleAddResourceEvent(parsed: ResourcePositionsEvent, game: Game) {
        parsed.resources.forEach(r => {
            const pos = createVector(r.pos.x, r.pos.y)
            const resource: Resource = new Resource(r.id, game.player, r.quantity, r.resourceType, pos, r.hitpoints, r.isSolid, game.app.loader, game.ws, r.isLootable)
            game.worldContainer.addChild(resource.container);

            const { gridCellKey } = r;
            if (this.resourceMap.has(gridCellKey)) {
                const resources = this.resourceMap.get(gridCellKey)
                resources.push(resource)
                this.resourceMap.set(gridCellKey, resources)
            } else {
                // init new array if its a new cell
                this.resourceMap.set(gridCellKey, [resource])
            }
        })
        this.updateResourceArr()
    }

    removeGridCellResources(gridCellKey: string, game: Game) {
        if (this.resourceMap.has(gridCellKey)) {
            this.resourceMap.get(gridCellKey).map(r => {
                game.worldContainer.removeChild(r.container)
            })
        }
        this.resourceMap.delete(gridCellKey)

        this.updateResourceArr()
    }

    updateResourceArr() {
        let allResources: Resource[] = []
        for (let k of this.resourceMap.keys()) {
            allResources = [...allResources, ...this.resourceMap.get(k)]
        }
        this.resourceArr = allResources
    }

    resources(): Resource[] {
        return this.resourceArr
    }

    handleUpdateResourceEvent(parsed: UpdateResourceEvent, game: Game) {
        let resources = this.resourceMap.get(parsed.gridCellKey)

        const r = resources.find(r => r.id == parsed.id)
        if (r) {
            if (parsed.remove) {
                resources = resources.filter(rO => rO.id !== parsed.id)
            }

            if (r.hitPoints.current !== parsed.hitpoints.current) {
                game.soundHandler.hitResource(r.resourceType)
            }

            if (parsed.damage > 0) {
                game.textHandler.addItem(`${parsed.damage}`, r.pos, "0xff0000")
            }

            r.hitPoints.current = parsed.hitpoints.current
            r.hitPoints.max = parsed.hitpoints.max
            r.updateHealthbar(r.container)

            if (r.hitPoints.current <= 0) {
                r.container.removeChild(r.sprite)
                this.container.removeChild(r.container)
            }

            this.resourceMap.set(parsed.gridCellKey, resources)
        } else {
            console.log("resourcen not found", parsed.gridCellKey)
            console.log(parsed.id)
        }
        this.updateResourceArr()
    }
}

export default ResourceHandler