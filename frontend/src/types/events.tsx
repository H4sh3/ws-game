import { EVENT_TYPES } from "../etc/const"
import Vector, { IVector } from "./vector"

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
    }
}

export interface PlayerTargetPositionEvent extends BaseEvent {
    id: number
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
        }
    }
}


interface HitResourceEvent extends BaseEvent {
    payload: {
        skill: string,
        id: number,
    }
}

export function getHitResourceEvent(skill: string, id: number): HitResourceEvent {
    return {
        "eventType": EVENT_TYPES.HIT_RESOURCE_EVENT,
        "payload": {
            "skill": skill,
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

export interface Hitpoints {
    current: number,
    max: number
}
export interface IResource {
    resourceType: string,
    pos: IVector,
    id: number,
    hitpoints: {
        current: number,
        max: number
    },
    isSolid: boolean,
}

export interface Resource {
    resourceType: string,
    id: number,
    pos: Vector,
    hitpoints: Hitpoints
    isSolid: boolean,
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

export interface UpdateResourceEvent {
    id: number,
    hitpoints: Hitpoints
}

export function isUpdateResourceEvent(value: any): value is UpdateResourceEvent {
    return (
        isBaseEvent(value) &&
        value.eventType === EVENT_TYPES.UPDATE_RESOURCE_EVENT
    )
}