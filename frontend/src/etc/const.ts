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