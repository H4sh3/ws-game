import { Container, Graphics, Sprite } from "pixi.js"
import { EVENT_TYPES } from "../etc/const"
import Vector, { IVector } from "../types/vector"

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

export interface AssignIdEvent extends BaseEvent {
    id: number
    pos: {
        x: number,
        y: number
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

export function isAssignUserIdEvent(value: any): value is AssignIdEvent {
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
    id: number,
    pos: Vector,
    hitpoints: Hitpoints
    isSolid: boolean,
    sprite: Sprite,
    container: Container,
    healtbar: Graphics
}

export interface ResourcePositionsEvent extends BaseEvent {
    resources: IResource[]
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



/*
 Events bellow are send from client to server 
*/


interface KeyBoardEvent extends BaseEvent {
    payload: {
        key: string,
        value: KeyStates,
    }
}

export function getKeyBoardEvent(key: string, value: KeyStates): string {
    return JSON.stringify({
        "eventType": EVENT_TYPES.KEYBOARD_EVENT,
        "payload": {
            "key": key,
            "value": value,
        }
    } as KeyBoardEvent)
}

interface HitResourceEvent extends BaseEvent {
    payload: {
        skill: string,
        id: number,
    }
}

export function getHitResourceEvent(skill: string, id: number): string {
    return JSON.stringify({
        "eventType": EVENT_TYPES.HIT_RESOURCE_EVENT,
        "payload": {
            "skill": skill,
            "id": id,
        }
    } as HitResourceEvent)
}

interface LootResourceEvent extends BaseEvent {
    payload: {
        id: number,
    }
}

export function getLootResourceEvent(resourceId: number): string {
    const e: LootResourceEvent = {
        "eventType": EVENT_TYPES.LOOT_RESOURCE_EVENT,
        "payload": {
            "id": resourceId,
        }
    }
    return JSON.stringify(e)
}
