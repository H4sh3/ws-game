import { AnimatedSprite, BaseTexture, Container, Loader, Sprite, Spritesheet, Texture } from "pixi.js";
import { createVector, getHitNpcEvent, Hitpoints, INpc } from "../events/events";
import { Player } from "./player";
import { HasHitpoints } from "./resource";
import Vector from "./vector";

function getTexturesFromSpriteSheet(path: string, numFrames: number) {
    const atlas = {
        frames: {
        },
        meta: {
            image: path,
            format: 'RGBA8888',
            size: { w: 1440, h: 64 },
            scale: "1"
        },
        animations: {
            frameNames: [] as string[]
        }
    }

    // sprites are 96*64
    const w = 96
    const h = 64

    const frames: { [id: string]: any } = {}
    const frameNames = []

    for (let i = 0; i < numFrames; i++) {
        const frameName = `${i}`
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

const deadKnightAnim = getTexturesFromSpriteSheet('assets/npcs/knight/dead/sprite_sheet.png', 15)
const walkingKnightAnim = getTexturesFromSpriteSheet('assets/npcs/knight/walking/sprite_sheet.png', 8)

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

    anim.onComplete = () => {
        console.log("dead animation finished!")
    }
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
        const sprite = new AnimatedSprite(walkingKnightAnim)//.fromFrames(getKnightTiles());
        sprite.animationSpeed = 0.3;
        sprite.anchor.set(0.5)
        sprite.scale.set(2, 2)

        this.sprite = sprite

        this.container = new Container()
        this.container.addChild(this.sprite)

        this.sprite.interactive = true

        this.sprite.on('click', () => {
            if (this.currentPos.dist(this.player.currentPos) < 150) {
                this.ws.send(getHitNpcEvent("1", this.UUID))
            }
        });

    }


    updatePosition() {
        const step = this.targetPos.copy().sub(this.currentPos).mult(0.2)

        // used for dead anim mirror scale

        if (step.mag() == 0) {
            //this.posChanged = false
            this.sprite.stop()
            return
        }


        if (step.mag() > 0.1) {
            this.currentPos.add(step)
        } else {
            this.currentPos = this.targetPos.copy()
        }
        //this.posChanged = true

        this.sprite.play()
        // if players moves left, mirror the sprite
        this.sprite.scale.x = step.x > 0 ? 2 : -2
        this.movesRight = step.x > 0
    }
}

export default Npc