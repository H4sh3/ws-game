import { Container } from "pixi.js"
import Npc from "../types/npc"

class NpcHandler {
    npcMap: Map<string, Npc[]>
    container: Container

    constructor() {
        this.npcMap = new Map()
        this.container = new Container()
    }

    addNpc() {

    }

    removeNpc() {

    }
}

export default NpcHandler