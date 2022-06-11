
export function createVector(x: number, y: number): Vector {
    return {
        x,
        y
    }
}

export interface BaseEvent {
    eventType: number
}

export function isBaseEvent(value: any): value is BaseEvent {
    console.log(value)
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
        value.eventType == 0
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

export interface Vector {
    x: number
    y: number
}

export interface UpdatePlayerVelocityEvent extends BaseEvent {
    id: number
    velocity: Vector
}


export class Player {
    id: number
    pos: Vector
    vel: Vector

    constructor(id: number, pos: Vector) {
        this.vel = createVector(0, 0)
        this.pos = pos
        this.id = id
    }

    update(vel: Vector) {
        this.pos.x += vel.x * 10
        this.pos.y += vel.y * 10
    }
}

export function isUpdatePlayerVelocityEvent(value: any): value is UpdatePlayerVelocityEvent {
    return (
        isBaseEvent(value) &&
        value.eventType == 4
    )
}

export function getKeyChangeEvent(key: string, value: KeyStates, id: number): KeyChangeEvent {
    return {
        "eventType": 3,
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
        value.eventType == 1
    )
}

export enum KeyStates {
    UP,
    DOWN
}
