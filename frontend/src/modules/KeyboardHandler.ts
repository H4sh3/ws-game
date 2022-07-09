import { getKeyBoardEvent, KeyStates } from "../events/events"
import { Game } from "../main"
import { Player } from "../types/player"
import { Resource } from "../types/resource"

export const VALID_KEYS = ["w", "a", "s", "d"]

export class KeyboardHandler {
    keys: Map<String, KeyStates>
    actionCooldown: number

    constructor() {
        this.actionCooldown = 0
        this.keys = new Map()
        VALID_KEYS.forEach(k => {
            this.keys.set(k, KeyStates.UP)
        })

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (!e.repeat) {
                this.keyChange(e.key, KeyStates.DOWN)
            }
        });
        document.addEventListener('keyup', (e: KeyboardEvent) => {
            if (!e.repeat) {
                this.keyChange(e.key, KeyStates.UP)
            }
        });
    }

    keyChange(key: string, value: KeyStates) {
        if (this.keys.get(key) !== value && value == KeyStates.DOWN) {
            // change in key state
            // send to server
            this.keys.set(key, value)
        }

        if (this.keys.get(key) === KeyStates.DOWN && value === KeyStates.UP) {
            this.keys.set(key, KeyStates.UP)
        }
    }

    handleKeyBoard(delta: number, game: Game) {
        this.actionCooldown -= delta

        if (this.actionCooldown > 0) {
            return
        }

        VALID_KEYS.forEach(key => {
            const value = this.keys.get(key)
            if (value == KeyStates.DOWN) {

                const newPos = game.player.targetPos.copy()

                switch (key) {
                    case "w":
                        newPos.y -= game.gameConfig.playerStepSize
                        break
                    case "a":
                        newPos.x -= game.gameConfig.playerStepSize
                        break
                    case "s":
                        newPos.y += game.gameConfig.playerStepSize
                        break
                    case "d":
                        newPos.x += game.gameConfig.playerStepSize
                        break
                }

                const hasCollision = game.resourceHandler.resources().filter(r => r.isSolid).some(r => r.pos.dist(newPos) < 40)
                if (!hasCollision) {
                    game.player.targetPos = newPos
                    game.ws.send(getKeyBoardEvent(key, value))
                    this.actionCooldown = 5
                }
            }
        })

    }
}