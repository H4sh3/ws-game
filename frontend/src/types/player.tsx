import Vector from "./vector"
import { createVector } from "./events"

export class Player {
    id: number
    currentPos: Vector
    targetPos: Vector
    vel: Vector

    constructor(id: number, pos: Vector) {
        this.vel = createVector(0, 0)
        this.currentPos = pos
        this.targetPos = pos
        this.id = id
    }
}