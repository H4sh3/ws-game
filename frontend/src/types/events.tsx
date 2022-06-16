import { EVENT_TYPES } from "../const"
import Vector from "./vector"

export function createVector(x: number, y: number): Vector {
    return new Vector(x, y)
}

export interface BaseEvent {
    eventType: string
}

export function isBaseEvent(value: any): value is BaseEvent {
    return (
        "eventType" in value
    )
}


export interface NewPlayerEvent extends BaseEvent {
    id: number
    pos: {
        x: number,
        y: number
    }
}

export function isNewPlayerEvent(value: any): value is NewPlayerEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.NEW_USER_EVENT
    )
}

export interface AssignidEvent extends BaseEvent {
    id: number
    pos: {
        x: number,
        y: number
    }
}


export interface KeyChangeEvent extends BaseEvent {
    payload: {
        key: string,
        value: KeyStates,
        id: number
    }
}

export interface PlayerTargetPositionEvent extends BaseEvent {
    id: number
    hasCollision: boolean
    pos: Vector
}

export interface PlayerDisconnectedEvent extends BaseEvent {
    id: number
}

export function isPlayerDisconnectedEvent(value: any): value is PlayerDisconnectedEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.PLAYER_DISCONNECTED_EVENT
    )
}


export function isPlayerTargetPositionEvent(value: any): value is PlayerTargetPositionEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.PLAYER_TARGET_POSITION_EVENT
    )
}

export function getKeyBoardEvent(key: string, value: KeyStates, id: number): KeyChangeEvent {
    return {
        "eventType": EVENT_TYPES.KEYBOARD_EVENT,
        "payload": {
            "key": key,
            "value": value,
            "id": id,
        }
    }
}

export function isAssignUserIdEvent(value: any): value is AssignidEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.ASSIGN_USER_ID_EVENT
    )
}

export enum KeyStates {
    UP,
    DOWN
}


export interface Resource {
    resourceType: string,
    pos: Vector,
    capacity: {
        current: number,
        max: number
    }
}

interface ResourcePositionsEvent extends BaseEvent {
    resources: Resource[]
}

export function isResourcePositionsEvent(value: any): value is ResourcePositionsEvent {
    return (
        isBaseEvent(value) &&
        value.eventType === EVENT_TYPES.RESOURCE_POSITIONS_EVENT
    )
}