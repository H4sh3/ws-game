import Vector from "./vector"
import { createVector, Hitpoints } from "../events/events"
import { AnimatedSprite, Container } from "pixi.js"
import { PLAYER_SPRITE_SCALE } from "../sprites/player"
import { HasHitpoints } from "./resource"
import { getTexturesFromSpriteSheet } from "./npc"

const deadAnimationTextures = getTexturesFromSpriteSheet("player_dead", 'assets/human/dead/sprite_sheet.png', 5, 48, 64)


const slash_animation = getTexturesFromSpriteSheet("slash_animation", 'assets/slash_animation.png', 5, 32, 32)


export class Player extends HasHitpoints {
    id: number
    currentPos: Vector
    targetPos: Vector
    posChanged: boolean
    vel: Vector
    frame: number
    sprite: AnimatedSprite
    deltaCount: number
    movesRight: boolean
    spriteContainer: Container
    hitpoints: Hitpoints
    isOtherPlayer?: boolean
    mouseDown?: boolean
    slashAnimation: AnimatedSprite
    attackSpeed: number
    actionCooldown: number

    constructor(id: number, pos: Vector, sprite: AnimatedSprite, hitpoints: Hitpoints, isOtherPlayer = true, mouseDown = false) {
        super(hitpoints, -35)

        this.attackSpeed = 60
        this.vel = createVector(0, 0)
        this.currentPos = pos
        this.targetPos = pos
        this.posChanged = false
        this.id = id
        this.frame = 0
        this.deltaCount = 0
        this.movesRight = true
        this.spriteContainer = new Container();
        this.sprite = sprite
        this.spriteContainer.addChild(this.sprite)
        this.spriteContainer.position.set(pos.x, pos.y)
        this.isOtherPlayer = isOtherPlayer
        this.mouseDown = mouseDown

        this.slashAnimation = new AnimatedSprite(slash_animation)
        this.slashAnimation.position.set(0, -40)

        let calcedAnimSpeed = 2 - ((this.attackSpeed * 50) / 750);
        calcedAnimSpeed = calcedAnimSpeed <= 0 ? 0.1 : calcedAnimSpeed
        this.sprite.animationSpeed = calcedAnimSpeed

        if (calcedAnimSpeed == 0.1) {
            this.slashAnimation.scale.set(3, 3)
        } else {
            this.slashAnimation.scale.set(2, 2)
        }

        this.slashAnimation.loop = false
        this.slashAnimation.visible = false
        this.slashAnimation.onComplete = () => {
            this.slashAnimation.visible = false
            this.slashAnimation.gotoAndStop(0)
        }
        this.spriteContainer.addChild(this.slashAnimation)

        this.actionCooldown = 0
    }

    canDoAction(): boolean {
        if (this.deltaCount > this.actionCooldown) {
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

    playHitAnim() {
        const toLeft = this.sprite.scale.x < 0
        const looksLeft = this.slashAnimation.scale.x < 0
        if (toLeft && !looksLeft) {
            this.slashAnimation.scale.x = -this.slashAnimation.scale.x
            this.slashAnimation.position.x = 20
        }
        if (!toLeft && looksLeft) {
            this.slashAnimation.position.x = -20
            this.slashAnimation.scale.x = Math.abs(this.slashAnimation.scale.x)
        }


        this.slashAnimation.visible = true
        this.slashAnimation.play()
    }
}
