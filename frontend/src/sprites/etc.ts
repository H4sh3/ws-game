import { Loader, Sprite } from "pixi.js"
import { SCREEN_SIZE } from "../etc/const"

export function getCursorSprite(loader: Loader) {
    const cs = new Sprite(loader.resources['assets/cursor.png'].texture)
    cs.anchor.set(0.5)
    return cs
}