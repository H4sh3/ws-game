import { Container } from "pixi.js"
import { createVector, NpcAttackAnimEvent, NpcListEvent, NpcTargetPositionEvent, UpdateNpcEvent } from "../events/events"
import { Game } from "../main"
import Npc, { spawnDeadAnim } from "../types/npc"
import Vector from "../types/vector"


class NpcHandler {
    npcMap: Map<string, Npc[]>
    container: Container


    constructor() {
        this.npcMap = new Map()
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
    }

    removeGridCellNpcs(gridCellKey: string) {
        this.npcMap.get(gridCellKey).forEach(npc => {
            this.container.removeChild(npc.container)
        })
        this.npcMap.delete(gridCellKey)
    }

    update() {
        this.npcArray().map(npc => {
            npc.updatePosition()
            npc.container.x = npc.currentPos.x
            npc.container.y = npc.currentPos.y
        })
    }

    npcArray() {
        let npcArray: Npc[] = []
        Array.from(this.npcMap.values()).map(p => {
            npcArray = [...npcArray, ...p]
        })
        return npcArray
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

    handleUpdateNpcEvent(event: UpdateNpcEvent): Vector {
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
        if (remove) { // npc dead
            this.container.removeChild(npc.container)
            spawnDeadAnim(this.container, npc)
            // create dead npc animation
        } else {
            npcs.push(npc)
        }

        this.npcMap.set(gridCellKey, npcs)

        npc.updateHealthbar(npc.container)

        return npc.currentPos.copy()
    }

    handleNpcAttackAnimEvent(event: NpcAttackAnimEvent) {
        this.npcArray().forEach(npc => {
            if (npc.UUID === event.npcUUID) {
                npc.playAttack()
            }
        })
    }
}

export default NpcHandler