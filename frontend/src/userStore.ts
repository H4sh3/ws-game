import { makeObservable, observable, computed, action, flow } from "mobx"

export class UserStore {
    cookiesAccepted: boolean
    loading: boolean
    playerUUID: string

    constructor() {
        makeObservable(this, {
            cookiesAccepted: observable,
            setCookiesAccepted: action,
            loading: observable,
            setLoading: action,
            playerUUID: observable,
            setPlayerUUID: action,
        })

        this.loading = true
    }

    setCookiesAccepted(value: boolean) {
        this.cookiesAccepted = value
    }

    setLoading(value: boolean) {
        this.loading = value
    }

    setPlayerUUID(value: string) {
        this.playerUUID = value
    }
}