import { Container } from "pixi.js"
import { createVector, NpcListEvent, NpcTargetPositionEvent, UpdateNpcEvent } from "../events/events"
import { Game } from "../main"
import Npc from "../types/npc"

class NpcHandler {
    npcMap: Map<string, Npc[]>
    npcArray: Npc[]
    container: Container

    constructor() {
        this.npcMap = new Map()
        this.npcArray = []
        this.container = new Container()
    }

    handleNpcListEvent(event: NpcListEvent, game: Game) {
        const { npcList, gridCellKey } = event
        const newNpcs: Npc[] = npcList.map(npc => {
            const n = new Npc(npc, game.ws, game.player)
            this.container.addChild(n.container)
            return n
        })
        this.npcMap.set(gridCellKey, newNpcs)

        // update npc array after new npc listings event
        this.npcMapToArray()
    }

    removeGridCellNpcs(gridCellKey: string) {
        this.npcMap.get(gridCellKey).forEach(npc => {
            this.container.removeChild(npc.container)
        })
        this.npcMap.delete(gridCellKey)

        this.npcMapToArray()
    }

    update() {
        this.npcArray.map(npc => {
            npc.updatePosition()
            npc.container.x = npc.currentPos.x
            npc.container.y = npc.currentPos.y
        })
    }

    npcMapToArray() {
        this.npcArray = []
        Array.from(this.npcMap.values()).map(p => {
            this.npcArray = [...this.npcArray, ...p]
        })
    }


    handleNpcTargetPositionEvent(event: NpcTargetPositionEvent) {
        const { gridCellKey, npcUUID, pos } = event

        let npcs = this.npcMap.get(gridCellKey)

        if (!npcs) {
            return
        }

        const npc = npcs.find(n => n.UUID === npcUUID)
        if (!npc) {
            return
        }

        npc.targetPos = createVector(pos.x, pos.y)
        npcs = npcs.filter(n => n.UUID !== npcUUID)
        npcs.push(npc)
        this.npcMap.set(gridCellKey, npcs)
    }

    handleUpdateNpcEvent(event: UpdateNpcEvent) {
        const { gridCellKey, npcUUID, hitpoints, remove } = event

        let npcs = this.npcMap.get(gridCellKey)

        if (!npcs) {
            return
        }

        const npc = npcs.find(n => n.UUID === npcUUID)
        if (!npc) {
            return
        }

        npc.hitPoints.current = hitpoints.current
        npcs = npcs.filter(n => n.UUID !== npcUUID)
        if (remove) {
            this.container.removeChild(npc.container)
        } else {
            npcs.push(npc)
        }

        this.npcMap.set(gridCellKey, npcs)

        npc.updateHealthbar(npc.container)
    }
}

export default NpcHandler