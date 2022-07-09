import { AnimatedSprite, Container, Loader, Sprite } from "pixi.js";
import { createVector, INpc } from "../events/events";
import Vector from "./vector";

export const getKnightTiles = (): string[] => {
    const paths = []
    for (let i = 0; i <= 7; i++) {
        paths.push(`assets/npcs/knight/tile00${i}.png`)
    }
    return paths
}

class Npc {
    UUID: string
    currentPos: Vector
    targetPos: Vector
    hp: number
    npcType: string

    container: Container
    sprite: AnimatedSprite

    constructor(serial: INpc) {
        this.UUID = serial.UUID
        this.currentPos = createVector(serial.pos.x, serial.pos.y)
        this.targetPos = createVector(serial.pos.x, serial.pos.y)
        this.hp = serial.hp


        // Todo: use loader for better performance
        const sprite = AnimatedSprite.fromFrames(getKnightTiles());
        sprite.animationSpeed = 0.3;
        sprite.anchor.set(0.5)
        sprite.scale.set(2, 2)

        this.sprite = sprite
        this.sprite.interactive = true

        this.sprite.on('click', () => {
            console.log("npc clicked")
        });
    }


    updatePosition() {
        const step = this.targetPos.copy().sub(this.currentPos).mult(0.2)
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
    }
}

export default Npc