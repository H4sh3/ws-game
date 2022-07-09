import Vector from "./vector"
import { createVector } from "../events/events"
import { AnimatedSprite, Container } from "pixi.js"
import { PLAYER_SPRITE_SCALE } from "../sprites/player"

export class Player {
    id: number
    currentPos: Vector
    targetPos: Vector
    posChanged: boolean
    vel: Vector
    frame: number
    sprite: AnimatedSprite
    deltaCount: number
    actionOnCooldown: boolean
    movesRight: boolean
    spriteContainer: Container

    constructor(id: number, pos: Vector, sprite: AnimatedSprite) {
        this.vel = createVector(0, 0)
        this.currentPos = pos
        this.targetPos = pos
        this.posChanged = false
        this.id = id
        this.frame = 0
        this.deltaCount = 0
        this.actionOnCooldown = true
        this.movesRight = true
        this.spriteContainer = new Container();
        this.sprite = sprite
        this.spriteContainer.addChild(this.sprite)
    }

    canDoAction(): boolean {
        if (this.deltaCount > 30) {
            this.deltaCount = 0
            return true
        }
        return false
    }

    updateCooldown(delta: number) {
        this.deltaCount += delta
    }

    updatePosition() {
        const step = this.targetPos.copy().sub(this.currentPos).mult(0.2)
        if (step.mag() == 0) {
            this.posChanged = false
            this.sprite.stop()
            return
        }


        if (step.mag() > 0.1) {
            this.currentPos.add(step)
        } else {
            this.currentPos = this.targetPos.copy()
        }
        this.posChanged = true

        this.sprite.play()
        // if players moves left, mirror the sprite
        this.sprite.scale.x = step.x > 0 ? PLAYER_SPRITE_SCALE : -PLAYER_SPRITE_SCALE
    }
}
