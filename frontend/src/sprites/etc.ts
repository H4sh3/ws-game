import { Application, Loader, Sprite } from "pixi.js"
import { Game } from "../main"

export function getCursorSprite(loader: Loader) {
    const cs = new Sprite(loader.resources['assets/cursor.png'].texture)
    cs.anchor.set(0.5)
    cs.x = 0
    cs.y = 445
    return cs
}

export function getBlockadeSprite(game: Game) {
    const s = new Sprite(game.app.loader.resources['assets/blockade.png'].texture)
    s.x = 5
    s.y = 445
    s.interactive = true

    s.on("click", () => {
        game.isEditing = !game.isEditing
        if (game.isEditing) {
            game.cursorSprite.texture = game.app.loader.resources['assets/blockade.png'].texture
            game.blockadeSprite.texture = game.app.loader.resources['assets/cursor.png'].texture
        } else {
            game.cursorSprite.texture = game.app.loader.resources['assets/cursor.png'].texture
            game.blockadeSprite.texture = game.app.loader.resources['assets/blockade.png'].texture
        }
    })

    return s
}