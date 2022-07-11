import { AnimatedSprite, BaseTexture, Container, Spritesheet, Texture } from "pixi.js";
import { createVector, getHitNpcEvent, Hitpoints, INpc } from "../events/events";
import { Player } from "./player";
import { HasHitpoints } from "./resource";
import Vector from "./vector";

enum AnimationNames {
    idle = 0,
    walking = 1,
    attacking = 2,
}

export function getTexturesFromSpriteSheet(name: string, path: string, numFrames: number, w: number, h: number) {
    const atlas = {
        frames: {
        },
        meta: {
            image: path,
            format: 'RGBA8888',
            //size: { w: 1440, h: 64 },
            scale: "1"
        },
        animations: {
            frameNames: [] as string[]
        }
    }

    const frames: { [id: string]: any } = {}
    const frameNames = []

    for (let i = 0; i < numFrames; i++) {
        const frameName = `${name}-${i}`
        frameNames.push(frameName)

        frames[frameName] = {
            frame: { x: i * w, y: 0, w, h },
            sourceSize: { w, h },
            spriteSourceSize: { x: 0, y: 0, w: w, h: h }
        }
    }

    atlas.frames = frames
    atlas.animations.frameNames = frameNames


    // Create the SpriteSheet from data and image
    const spritesheet = new Spritesheet(
        BaseTexture.from(atlas.meta.image),
        atlas
    );

    // Generate all the Textures asynchronously
    let textures: Texture[];
    spritesheet.parse(() => {
        textures = spritesheet.animations.frameNames
    });
    return textures
}

const deadKnightAnim = getTexturesFromSpriteSheet("knight_dead", 'assets/npcs/knight/dead/sprite_sheet.png', 15, 96, 64)
const walkingKnightAnim = getTexturesFromSpriteSheet("knight_walk", 'assets/npcs/knight/walking/sprite_sheet.png', 8, 96, 64)
const idleKnightAnim = getTexturesFromSpriteSheet("knight_idle", 'assets/npcs/knight/idle/sprite_sheet.png', 15, 64, 64)
const attackKnightAnim = getTexturesFromSpriteSheet("knight_attack", 'assets/npcs/knight/attack/sprite_sheet.png', 13, 144, 64)

export function spawnDeadAnim(container: Container, npc: Npc) {
    const anim = new AnimatedSprite(deadKnightAnim);
    anim.play()
    anim.animationSpeed = 0.25
    anim.loop = false

    if (npc.movesRight) {
        anim.scale.set(2, 2)
    } else {
        anim.scale.set(-2, 2)
    }

    anim.anchor.set(0.5, 0.5)
    anim.position.set(npc.currentPos.x, npc.currentPos.y)
    container.addChild(anim)

}

class Npc extends HasHitpoints {
    UUID: string
    currentPos: Vector
    targetPos: Vector
    hitpoints: Hitpoints
    npcType: string
    movesRight: boolean

    container: Container
    sprite: AnimatedSprite

    ws: WebSocket
    player: Player

    activeAnimation: AnimationNames

    constructor(serial: INpc, ws: WebSocket, player: Player) {
        super(serial.hitpoints, -50)

        this.player = player
        this.ws = ws

        this.movesRight = true

        this.UUID = serial.UUID
        this.currentPos = createVector(serial.pos.x, serial.pos.y)
        this.targetPos = createVector(serial.pos.x, serial.pos.y)
        this.hitpoints = serial.hitpoints


        // Todo: use loader for better performance
        this.useIdleSprite()
        this.sprite.interactive = true
        this.sprite.on('click', () => {
            if (this.currentPos.dist(this.player.currentPos) < 150) {
                this.ws.send(getHitNpcEvent("1", this.UUID))
            }
        });

        this.container = new Container()
        this.container.addChild(this.sprite)
    }


    updatePosition() {

        // dont move on attack
        if (this.activeAnimation === AnimationNames.attacking) return

        const step = this.targetPos.copy().sub(this.currentPos).mult(0.2)

        // used for dead anim mirror scale

        if (step.mag() == 0) {
            this.useIdleSprite()
            return
        }


        if (step.mag() > 0.1) {
            this.currentPos.add(step)
        } else {
            this.currentPos = this.targetPos.copy()
        }

        this.useWalkSprite()

        // if players moves left, mirror the sprite
        this.movesRight = step.x > 0
        this.sprite.scale.x = this.movesRight ? 2 : -2

    }

    useWalkSprite() {
        if (this.activeAnimation === AnimationNames.walking || this.activeAnimation === AnimationNames.attacking) return

        if (this.sprite === undefined) {
            this.sprite = new AnimatedSprite(walkingKnightAnim)
        }

        this.sprite.textures = walkingKnightAnim
        this.sprite.animationSpeed = 0.3;
        this.sprite.anchor.set(0.5)
        this.sprite.scale.set(2, 2)
        this.sprite.play()
        this.activeAnimation = AnimationNames.walking
    }

    useIdleSprite(force: boolean = false) {
        if (!force && (this.activeAnimation === AnimationNames.idle || this.activeAnimation === AnimationNames.attacking)) return

        if (this.sprite === undefined) {
            this.sprite = new AnimatedSprite(idleKnightAnim)
        }

        this.sprite.textures = idleKnightAnim
        this.sprite.animationSpeed = 0.4;
        this.sprite.anchor.set(0.5)
        this.sprite.scale.set(2, 2)
        this.sprite.play()
        this.activeAnimation = AnimationNames.idle
    }

    playAttack() {
        if (this.activeAnimation === AnimationNames.attacking) return

        if (this.sprite === undefined) {
            this.sprite = new AnimatedSprite(attackKnightAnim)
        }

        this.sprite.textures = attackKnightAnim
        this.sprite.animationSpeed = 0.4;
        this.sprite.anchor.set(0.5)
        this.sprite.scale.set(2, 2)
        this.sprite.scale.x = this.movesRight ? 2 : -2

        this.sprite.play()
        this.sprite.loop = false
        this.activeAnimation = AnimationNames.attacking

        this.sprite.onComplete = () => {
            console.log("back to idle")
            this.useIdleSprite(true)
        }
    }
}

export default Npc