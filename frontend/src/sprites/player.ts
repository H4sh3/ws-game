import { Loader, Sprite } from "pixi.js";

export function getOwnPlayerSprite(loader: Loader): Sprite {
    const playerSprite = new Sprite(loader.resources['assets/player0.png'].texture)
    playerSprite.x = 250
    playerSprite.y = 250
    playerSprite.anchor.set(0.5)
    return playerSprite
}