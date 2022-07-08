import { AnimatedSprite, Container, Loader, Sprite } from "pixi.js";
import { createVector, NpcI } from "../events/events";
import Vector from "./vector";

export const getKnightTiles = (): string[] => {
    const paths = []
    for (let i = 0; i <= 7; i++) {
        paths.push(`assets/npcs/knight/tile00${i}.png`)
    }
    return paths
}

class Npc implements NpcI {
    UUID: string
    pos: Vector
    hp: number
    npcType: string

    container: Container
    sprite: Sprite

    constructor(serial: NpcI) {
        this.UUID = serial.UUID
        this.pos = createVector(serial.pos.x, serial.pos.y)
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
}

export default Npc