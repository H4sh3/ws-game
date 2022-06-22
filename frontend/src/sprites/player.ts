import { Loader, Sprite } from "pixi.js";
import { SCREEN_SIZE } from "../etc/const";

export function getOwnPlayerSprite(loader: Loader): Sprite {
    const playerSprite = new Sprite(loader.resources['assets/player0.png'].texture)
    playerSprite.x = (SCREEN_SIZE / 2)
    playerSprite.y = (SCREEN_SIZE / 2)
    playerSprite.anchor.set(0.5)
    return playerSprite
}