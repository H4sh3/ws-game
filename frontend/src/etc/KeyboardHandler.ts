import { KeyStates } from "../events/events"

export const VALID_KEYS = ["w", "a", "s", "d"]

export class KeyboardHandler {
    keys: Map<String, KeyStates>

    constructor() {
        this.keys = new Map()
        VALID_KEYS.forEach(k => {
            this.keys.set(k, KeyStates.UP)
        })

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (!e.repeat) {
                this.keyChange(e.key, KeyStates.DOWN)
            }
        });
        document.addEventListener('keyup', (e: KeyboardEvent) => {
            if (!e.repeat) {
                this.keyChange(e.key, KeyStates.UP)
            }
        });
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