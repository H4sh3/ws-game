import * as PIXI from "pixi.js";

export enum EVENT_TYPES {
    NEW_USER_EVENT = "NEW_USER_EVENT",
    ASSIGN_USER_ID_EVENT = "ASSIGN_USER_ID_EVENT",
    USER_MOVE_EVENT = "USER_MOVE_EVENT",
    KEYBOARD_EVENT = "KEYBOARD_EVENT",
    PLAYER_TARGET_POSITION_EVENT = "PLAYER_TARGET_POSITION_EVENT",
    RESOURCE_POSITIONS_EVENT = "RESOURCE_POSITIONS_EVENT",
    PLAYER_DISCONNECTED_EVENT = "PLAYER_DISCONNECTED_EVENT",
    HIT_RESOURCE_EVENT = "HIT_RESOURCE_EVENT",
    UPDATE_RESOURCE_EVENT = "UPDATE_RESOURCE_EVENT"
}

export const PlayerTextures = [
    PIXI.Texture.from(`/assets/player0.png`),
    PIXI.Texture.from(`/assets/player1.png`),
    PIXI.Texture.from(`/assets/player2.png`),
    PIXI.Texture.from(`/assets/player3.png`)
]

const IRON_TEXTURE = PIXI.Texture.from(`/assets/iron.png`)
const BRICK_TEXTURE = PIXI.Texture.from(`/assets/brick.png`)
const STONE_TEXTURE = PIXI.Texture.from(`/assets/stone.png`)

export const getAsserTexture = (name: string) => {
    if (name === "iron") {
        return IRON_TEXTURE
    } else if (name === "brick") {
        return BRICK_TEXTURE
    } else {
        return STONE_TEXTURE
    }
}

const local = "ws://127.0.0.1:7777"
const prod = "wss://game.gymcadia.com/websocket"
//export const wsUrl = import.meta.env.MODE === 'development' ? local : prod