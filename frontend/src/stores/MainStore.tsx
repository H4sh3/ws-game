import create from 'zustand';
import { combine } from 'zustand/middleware';
import produce from 'immer';
import { createVector, getKeyBoardEvent, IResource, KeyStates, Resource, UpdateResourceEvent } from '../types/events';
import Vector from '../types/vector';
import { Player } from '../types/player';


const VALID_KEYS = ["w", "a", "s", "d"]

export class KeyboardInputHandler {
    keys: Map<String, KeyStates>

    constructor() {
        this.keys = new Map()
        VALID_KEYS.forEach(k => {
            this.keys.set(k, KeyStates.UP)
        })
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
}

interface KeyEvent {
    key: string
    value: KeyStates
}

interface State {
    readonly playerId: number
    readonly players: Player[]// Map<number, Player>
    readonly count: number
    readonly resources: Resource[]
    readonly keyboardInputHandler: KeyboardInputHandler
    readonly keys: Map<String, KeyStates>
    readonly ws: WebSocket | undefined
    readonly keyEvents: KeyEvent[]
}


export const useMainStore = create(
    combine(
        {
            playerId: -1,
            players: [],
            count: 0,
            resources: [],
            currentPosition: createVector(0, 0),
            targetPosition: createVector(0, 0),
            keyboardInputHandler: new KeyboardInputHandler(),
            keys: new Map<String, KeyStates>(),
            ws: undefined,
            keyEvents: []
        } as State,
        (set, get) => ({
            setPlayerId: (id: number) => {
                set((state) => produce(state, draftState => {
                    draftState.playerId = id
                }));
            },
            spawnPlayer: (id: number, pos: Vector) => {
                set((state) => produce(state, draftState => {
                    draftState.players.push(new Player(id, pos))
                }));
            },
            removePlayer: (id: number) => {
                set((state) => produce(state, draftState => {
                    draftState.players = state.players.filter(p => p.id !== id)
                }));
            },
            setPlayerTargetPos: (id: number, pos: Vector) => {
                set((state) => produce(state, draftState => {
                    if (id === state.playerId) return

                    const p = state.players.find(p => p.id == id)
                    if (p) {
                        p.targetPos = pos
                    }
                }));
            },
            setWs: (ws: WebSocket) => {
                set((state) => produce(state, draftState => {
                    draftState.ws = ws
                }));
            },
            addResources: (resources: IResource[]) => {
                set((state) => produce(state, draftState => {
                    const newResources: Resource[] = [...state.resources]
                    resources.map(r => {
                        const rX = {
                            hitpoints: r.hitpoints,
                            id: r.id,
                            pos: createVector(r.pos.x, r.pos.y),
                            resourceType: r.resourceType
                        }
                        newResources.push(rX)
                    })
                    draftState.resources = newResources
                }));
            },
            getPlayerArr: (): Player[] => {
                return get().players
            },
            getPlayerFrame: (): number => {
                const player = get().players.find(p => p.id === get().playerId)
                return player !== undefined ? player.frame : 0
            },
            getPlayerPos: (): Vector => {
                const pId = get().playerId
                const player = get().players.find(p => p.id == pId)
                if (player != undefined) {
                    return player.currentPos.copy()
                }
                return createVector(0, 0)
            },
            getResources: (): Resource[] => {
                return get().resources
            },
            getOtherPlayers: (): Player[] => {
                const players = get().players
                const pId = get().playerId
                return players.filter(p => p.id !== pId)
            },
            // Todo: make sense of delta and how it changes by different frametimes
            updatePlayerPositions: (delta: number) => {
                set((state) => produce(state, draftState => {
                    // update other players positions
                    get().players.map(player => {
                        // take step to target direction
                        const step = player.targetPos.copy().sub(player.currentPos).mult(0.2)

                        if (step.mag() > 0.1) {
                            player.currentPos.add(step)
                            if (state.count % 4 == 0) {
                                player.frame = (player.frame + 1) % 4
                            }
                        } else {
                            player.currentPos = player.targetPos.copy()
                            player.frame = 0
                        }
                    })
                    draftState.count += 1

                    if (state.ws === undefined) return

                    const player = draftState.players.find(p => p.id === state.playerId)
                    if (player !== undefined) {

                        VALID_KEYS.forEach(key => {
                            const value = state.keyboardInputHandler.keys.get(key)
                            if (value == KeyStates.DOWN) {

                                const newPos = player.targetPos.copy()

                                const stepSize = 5

                                if (key == "w") {
                                    newPos.y -= stepSize
                                }

                                if (key == "a") {
                                    newPos.x -= stepSize
                                }

                                if (key == "s") {
                                    newPos.y += stepSize
                                }

                                if (key == "d") {
                                    newPos.x += stepSize
                                }

                                const hasCollision = state.resources.some(r => r.pos.dist(newPos) < 40)

                                if (state.ws !== undefined && !hasCollision) {
                                    player.targetPos = newPos
                                    state.ws.send(JSON.stringify(getKeyBoardEvent(key, value, state.playerId)))
                                }
                            }
                        })
                    }

                }));
            },
            addKeyEvent: (key: string, value: KeyStates) => {
                set((state) => produce(state, draftState => {
                    draftState.keyboardInputHandler.keyChange(key, value)
                }));
            },
            handleResourceHit: (event: UpdateResourceEvent) => {
                set((state) => produce(state, draftState => {
                    const resource = draftState.resources.find(r => r.id === event.id)
                    if (resource !== undefined) {
                        // resource hitpoints less then equal to 0 -> remove
                        if (event.hitpoints.current === 0) {
                            draftState.resources = draftState.resources.filter(r => r.id !== event.id)
                        } else {
                            resource.hitpoints.current = event.hitpoints.current
                            resource.hitpoints.max = event.hitpoints.max
                        }
                    }
                }));
            },
        })
    )
);
