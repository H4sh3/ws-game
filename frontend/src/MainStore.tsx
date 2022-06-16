import create from 'zustand';
import { combine } from 'zustand/middleware';
import produce from 'immer';
import { createVector, getKeyBoardEvent, IResource, KeyStates, Resource } from './types/events';
import Vector from './types/vector';
import { Player } from './types/player';


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
    readonly fps: number
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
            fps: 0,
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
            setResources: (resources: IResource[]) => {
                set((state) => produce(state, draftState => {
                    draftState.resources = resources.map(r => {
                        return {
                            capacity: r.capacity,
                            pos: createVector(r.pos.x, r.pos.y),
                            resourceType: r.resourceType
                        }
                    })
                }));
            },
            getPlayerArr: (): Player[] => {
                return get().players
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
                        const diff = player.targetPos.copy().sub(player.currentPos)

                        // slow down the movement
                        diff.mult(0.2)

                        if (diff.mag() > 0.1) {
                            player.currentPos.add(diff)
                        } else {
                            player.currentPos = player.targetPos.copy()
                        }
                    })
                    draftState.fps += 1

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
        })
    )
);
