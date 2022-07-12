import { Resource } from "../types/resource"
import Vector, { IVector } from "../types/vector"

export enum EVENT_TYPES {
    NEW_USER_EVENT = 0,
    USER_INIT_EVENT = 1,
    USER_MOVE_EVENT = 2,
    KEYBOARD_EVENT = 3,
    PLAYER_TARGET_POSITION_EVENT = 4,
    RESOURCE_POSITIONS_EVENT = 5,
    REMOVE_PLAYER_EVENT = 6,
    HIT_RESOURCE_EVENT = 7,
    UPDATE_RESOURCE_EVENT = 8,
    LOOT_RESOURCE_EVENT = 9,
    PLAYER_PLACED_RESOURCE_EVENT = 10,
    LOAD_INVENTORY_EVENT = 11,
    UPDATE_INVENTORY_EVENT = 12,
    REMOVE_GRID_CELL = 13,
    MULTIPLE_EVENTS = 14,
    LOGIN_PLAYER_EVENT = 15,
    CELL_DATA_EVENT = 16,
    NPC_LIST_EVENT = 17,
    NPC_TARGET_POSITION_EVENT = 18,
    HIT_NPC_EVENT = 19,
    UPDATE_NPC_EVENT = 20,
    UPDATE_PLAYER_EVENT = 21,
    NPC_ATTACK_ANIM_EVENT = 22,
}

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
    hitpoints: Hitpoints
}

export function isNewPlayerEvent(value: any): value is NewPlayerEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.NEW_USER_EVENT
    )
}

export interface GameConfig {
    gridCellSize: number
    subCells: number
    playerStepSize: number
    subCellSize: number
}

export interface UserInitEvent extends BaseEvent {
    id: number,
    uuid: string,
    pos: {
        x: number,
        y: number
    }
    hitpoints: Hitpoints
    gameConfig: GameConfig
}

export function isUserInitEvent(value: any): value is UserInitEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.USER_INIT_EVENT
    )
}

export interface PlayerTargetPositionEvent extends BaseEvent {
    id: number
    pos: Vector
    force: boolean
}

export function isPlayerTargetPositionEvent(value: any): value is PlayerTargetPositionEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.PLAYER_TARGET_POSITION_EVENT
    )
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


export enum KeyStates {
    UP,
    DOWN
}

export interface Hitpoints {
    current: number,
    max: number
}

export interface ResourceMin {
    resourceType: string,
    quantity: number,
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
    id: number
    gridCellKey: string
    hitpoints: Hitpoints
    remove: boolean
    damage: number
}

export function isUpdateResourceEvent(value: any): value is UpdateResourceEvent {
    return (
        isBaseEvent(value) &&
        value.eventType === EVENT_TYPES.UPDATE_RESOURCE_EVENT
    )
}

export interface UpdateNpcEvent {
    npcUUID: string
    gridCellKey: string
    hitpoints: Hitpoints
    remove: boolean
    damage: number
}

export function isUpdateNpcEvent(value: any): value is UpdateNpcEvent {
    return (
        isBaseEvent(value) &&
        value.eventType === EVENT_TYPES.UPDATE_NPC_EVENT
    )
}

export interface LoadInventoryEvent extends BaseEvent {
    resources: ResourceMin[]
}

export function isLoadInventoryEvent(value: any): value is LoadInventoryEvent {
    return (
        isBaseEvent(value) &&
        value.eventType === EVENT_TYPES.LOAD_INVENTORY_EVENT
    )
}

export interface UpdateInventoryEvent extends BaseEvent {
    resource: ResourceMin,
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

export interface SubCell {
    pos: Vector,
    terrainType: string
}

export interface CellDataEvent extends BaseEvent {
    pos: {
        x: number,
        y: number
    },
    subCells: SubCell[]
    gridCellKey: string,
    subCellBase64: string
}

export function isCellDataEvent(value: any): value is CellDataEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.CELL_DATA_EVENT
    )
}

export interface INpc {
    UUID: string
    pos: IVector
    hitpoints: Hitpoints
    npcType: string
    attackSpeed: number
}

export interface NpcListEvent extends BaseEvent {
    gridCellKey: string
    npcList: INpc[]
}

export function isNpcListEvent(value: any): value is NpcListEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.NPC_LIST_EVENT
    )
}

export interface NpcTargetPositionEvent extends BaseEvent {
    gridCellKey: string,
    npcUUID: string
    pos: IVector
}

export function isNpcTargetPositionEvent(value: any): value is NpcTargetPositionEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.NPC_TARGET_POSITION_EVENT
    )
}

export interface UpdatePlayerEvent extends BaseEvent {
    playerId: number,
    hitpoints: Hitpoints,
    damage: number,
    heal: number,
    crit: boolean
}

export function isUpdatePlayerEvent(value: any): value is UpdatePlayerEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.UPDATE_PLAYER_EVENT
    )
}

export interface NpcAttackAnimEvent extends BaseEvent {
    npcUUID: string
    attackId: number
}

export function isNpcAttackAnimEvent(value: any): value is NpcAttackAnimEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == EVENT_TYPES.NPC_ATTACK_ANIM_EVENT
    )
}

type EventTypes =
    NewPlayerEvent |
    UserInitEvent |
    PlayerTargetPositionEvent |
    RemovePlayerEvent |
    Hitpoints |
    IResource |
    ResourcePositionsEvent |
    UpdateResourceEvent |
    LoadInventoryEvent |
    UpdateInventoryEvent |
    RemoveGridCellEvent |
    MultipleEvents |
    CellDataEvent |
    NpcListEvent |
    NpcTargetPositionEvent |
    UpdatePlayerEvent |
    NpcAttackAnimEvent

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

interface LoginPlayerEvent extends BaseEvent {
    payload: {
        uuid: string,
    }
}

export function getLoginPlayerEvent(uuid: string): string {
    const e: LoginPlayerEvent = {
        "eventType": EVENT_TYPES.LOGIN_PLAYER_EVENT,
        "payload": {
            "uuid": uuid
        }
    }
    return JSON.stringify(e)
}

interface HitNpcEvent extends BaseEvent {
    payload: {
        skill: string,
        uuid: string,
    }
}

export function getHitNpcEvent(skill: string, uuid: string): string {
    const e: HitNpcEvent = {
        "eventType": EVENT_TYPES.HIT_NPC_EVENT,
        "payload": {
            "skill": skill,
            "uuid": uuid,
        }
    }
    return JSON.stringify(e)
}