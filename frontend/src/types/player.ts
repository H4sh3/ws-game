import Vector from "./vector"
import { createVector, Hitpoints } from "../events/events"
import { AnimatedSprite, Container, Graphics } from "pixi.js"
import { PLAYER_SPRITE_SCALE } from "../sprites/player"
import { HasHitpoints } from "./resource"
import { getTexturesFromSpriteSheet } from "./npc"

const deadAnimationTextures = getTexturesFromSpriteSheet('assets/human/dead/sprite_sheet.png', 5, 48, 64)

export class Player extends HasHitpoints {
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
    hitpoints: Hitpoints
    isOtherPlayer?: boolean

    constructor(id: number, pos: Vector, sprite: AnimatedSprite, hitpoints: Hitpoints, isOtherPlayer = true) {
        super(hitpoints, -35)

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
        this.spriteContainer.position.set(pos.x, pos.y)
        this.isOtherPlayer = isOtherPlayer
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

        if (this.isOtherPlayer) {
            this.spriteContainer.x = this.currentPos.x
            this.spriteContainer.y = this.currentPos.y
        }
    }

    updateHitpoints(hitpoints: Hitpoints) {
        this.hitPoints = hitpoints

        if (this.hitPoints.current <= 0) {
            this.sprite.scale.set(0, 0)
            const anim = new AnimatedSprite(deadAnimationTextures);
            this.spriteContainer.addChild(anim)
            anim.scale.set(2, 2)
            anim.anchor.set(0.5, 0.5)
            anim.loop = false
            anim.play()
            anim.animationSpeed = 0.05
        }
    }
}
