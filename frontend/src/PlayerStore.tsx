import create from 'zustand';
import { combine } from 'zustand/middleware';
import produce from 'immer';
import { createVector, Player, Vector } from './types';

interface State {
    readonly players: Map<number, Player>
    readonly fps: number
}


export const usePlayers = create(
    combine(
        {
            players: new Map(),
            fps: 0
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
            getPlayerArr: (): Player[] => {
                return Array.from(get().players.values())
            },
        })
    )
);