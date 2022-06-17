import Vector from "./vector"
import { createVector } from "../events/events"
import { Sprite } from "pixi.js"

export class Player {
    id: number
    currentPos: Vector
    targetPos: Vector
    vel: Vector
    frame: number
    sprite: Sprite

    constructor(id: number, pos: Vector, sprite: Sprite) {
        this.vel = createVector(0, 0)
        this.currentPos = pos
        this.targetPos = pos
        this.id = id
        this.frame = 0
        this.sprite = sprite
    }

    updatePosition() {
        const step = this.targetPos.copy().sub(this.currentPos).mult(0.2)
        if (step.mag() > 0.1) {
            this.currentPos.add(step)
        } else {
            this.currentPos = this.targetPos.copy()
        }
    }
}