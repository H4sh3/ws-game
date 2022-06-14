import create from 'zustand';
import { combine } from 'zustand/middleware';
import produce from 'immer';
import { Player, Resource, Vector } from './eventTypes';

interface State {
    readonly players: Map<number, Player>
    readonly fps: number
    readonly resources: Resource[]
}


export const useMainStore = create(
    combine(
        {
            players: new Map(),
            fps: 0,
            resources: []
        } as State,
        (set, get) => ({
            spawnPlayer: (id: number, pos: Vector) => {
                set((state) => produce(state, draftState => {
                    draftState.players.set(id, new Player(id, pos))
                }));
            },
            updatePlayer: (id: number, vel: Vector) => {
                set((state) => produce(state, draftState => {
                    console.log({ id })
                    const p = state.players.get(id)
                    console.log({ p })
                    if (p) {
                        p.update(vel)
                        draftState.players.set(id, p)
                        draftState.fps += 1
                    }
                }));
            },
            setResources: (resources: Resource[]) => {
                set((state) => produce(state, draftState => {
                    draftState.resources = resources
                }));
            },
            getPlayerArr: (): Player[] => {
                return Array.from(get().players.values())
            },
            getResources: (): Resource[] => {
                return get().resources
            },

        })
    )
);