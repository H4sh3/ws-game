import { Container, Graphics, Sprite } from "pixi.js"
import { EVENT_TYPES } from "../etc/const"
import { Resource } from "../types/resource"
import Vector from "../types/vector"

export function createVector(x: number, y: number): Vector {
    return new Vector(x, y)
}

export interface BaseEvent {
    eventType: number
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

export interface RemovePlayerEvent extends BaseEvent {
    id: number
}

export function isRemovePlayerEvent(value: any): value is RemovePlayerEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.REMOVE_PLAYER_EVENT
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
    gridCellKey: string,
    quantity: number,
    pos: Vector,
    hitpoints: Hitpoints
    isSolid: boolean,
    isLootable: boolean,
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
    gridCellKey: string,
    hitpoints: Hitpoints,
    remove: boolean
}

export function isUpdateResourceEvent(value: any): value is UpdateResourceEvent {
    return (
        isBaseEvent(value) &&
        value.eventType === EVENT_TYPES.UPDATE_RESOURCE_EVENT
    )
}



export interface LoadInventoryEvent extends BaseEvent {
    items: { [key: string]: IResource }
}

export function isLoadInventoryEvent(value: any): value is LoadInventoryEvent {
    return (
        isBaseEvent(value) &&
        value.eventType === EVENT_TYPES.LOAD_INVENTORY_EVENT
    )
}

export interface UpdateInventoryEvent extends BaseEvent {
    item: Resource,
    remove: boolean
}
export function isUpdateInventoryEvent(value: any): value is UpdateInventoryEvent {
    return (
        isBaseEvent(value) &&
        value.eventType === EVENT_TYPES.UPDATE_INVENTORY_EVENT
    )
}


export interface RemoveGridCellEvent extends BaseEvent {
    gridCellKey: string
}

export function isRemoveGridCellEvent(value: any): value is RemoveGridCellEvent {
    return (
        isBaseEvent(value) &&
        value.eventType === EVENT_TYPES.REMOVE_GRID_CELL
    )
}

type EventTypes =
    NewPlayerEvent |
    AssignIdEvent |
    PlayerTargetPositionEvent |
    RemovePlayerEvent |
    Hitpoints |
    IResource |
    ResourcePositionsEvent |
    UpdateResourceEvent |
    LoadInventoryEvent |
    UpdateInventoryEvent |
    RemoveGridCellEvent |
    MultipleEvents

export interface MultipleEvents extends BaseEvent {
    events: EventTypes[]
}

export function isMultipleEvents(value: any): value is MultipleEvents {
    return (
        isBaseEvent(value) &&
        value.eventType === EVENT_TYPES.MULTIPLE_EVENTS
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
    const e: KeyBoardEvent = {
        "eventType": EVENT_TYPES.KEYBOARD_EVENT,
        "payload": {
            "key": key,
            "value": value,
        }
    }
    return JSON.stringify(e)
}

interface HitResourceEvent extends BaseEvent {
    payload: {
        skill: string,
        id: number,
    }
}

export function getHitResourceEvent(skill: string, id: number): string {
    const e: HitResourceEvent = {
        "eventType": EVENT_TYPES.HIT_RESOURCE_EVENT,
        "payload": {
            "skill": skill,
            "id": id,
        }
    }
    return JSON.stringify(e)
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

interface PlayerPlacedResourceEvent extends BaseEvent {
    payload: {
        resourceType: string,
        pos: Vector
    }
}

export function getPlayerPlacedResourceEvent(resourceType: string, pos: Vector): string {
    const e: PlayerPlacedResourceEvent = {
        "eventType": EVENT_TYPES.PLAYER_PLACED_RESOURCE_EVENT,
        "payload": {
            "resourceType": resourceType,
            "pos": pos
        }
    }
    return JSON.stringify(e)
}