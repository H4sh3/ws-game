const UUID_KEY = 'secret_uuid'

export class LocalStorageWrapper {
    uuid: string

    constructor() {
        this.uuid = ""
        let existingUUID: string | undefined = localStorage.getItem(UUID_KEY)

        if (existingUUID !== null) {
            console.log(`client already has an uuid: ${existingUUID}`)
            this.uuid = existingUUID
        } else {
            console.log(`client has no uuid`)
        }
    }

    setUUID(uuid: string) {
        if (uuid.length == 0) return
        this.uuid = uuid
        localStorage.setItem(UUID_KEY, uuid)
    }
}