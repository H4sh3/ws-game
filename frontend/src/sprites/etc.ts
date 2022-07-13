import { Loader, Sprite } from "pixi.js"
import { RESOURCE_SCALE } from "../etc/const"

export function getCursorSprite(loader: Loader) {
    const cs = new Sprite(loader.resources['assets/cursor.png'].texture)
    cs.visible = false
    cs.anchor.set(0.5)
    cs.scale.set(RESOURCE_SCALE, RESOURCE_SCALE)
    return cs
}