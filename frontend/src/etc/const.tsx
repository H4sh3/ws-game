
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

export const playerFrames = [
    "player0.png", "player1.png", "player2.png", "player3.png"
]

export enum ASSETS {
    Iron = "iron.png"
}

const local = "ws://127.0.0.1:7777"
const prod = "wss://game.gymcadia.com/websocket"
export const wsUrl = import.meta.env.MODE === 'development' ? local : prod