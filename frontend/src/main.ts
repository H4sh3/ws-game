import { Application, Container, Sprite } from 'pixi.js';
import { isPlayerTargetPositionEvent, createVector, isUpdateResourceEvent, isResourcePositionsEvent, isRemovePlayerEvent, isNewPlayerEvent, KeyStates, getKeyBoardEvent, ResourcePositionsEvent, RemovePlayerEvent, PlayerTargetPositionEvent, NewPlayerEvent, AssignUserIdAndConfigEvent, UpdateResourceEvent, getPlayerPlacedResourceEvent, isLoadInventoryEvent, isUpdateInventoryEvent, isRemoveGridCellEvent, RemoveGridCellEvent, isMultipleEvents, getLoginPlayerEvent, isCellDataEvent, UpdateInventoryEvent, LoadInventoryEvent, isNpcListEvent, NpcListEvent, isNpcTargetPositionEvent, NpcTargetPositionEvent, isAssignUserIdAndConfigEvent, GameConfig, isUpdateNpcEvent, UpdateNpcEvent } from './events/events';
import { Player } from './types/player';
import { Resource } from './types/resource';
import Vector from './types/vector';
import { getInventoryBackground } from './sprites/background';
import { getOtherPlayerSprite, getOwnPlayerSprite } from './sprites/player';
import { getCursorSprite } from './sprites/etc';
import { SCREEN_SIZE } from './etc/const';
import { InventoryStore, Item } from './inventoryStore'

import { Tilemap } from '@pixi/tilemap';

import { UserStore } from './userStore';
import { LocalStorageWrapper } from './localStorageWrapper';
import TilemapHandler from './modules/TilemapHandler';
import { KeyboardHandler, VALID_KEYS } from './modules/KeyboardHandler';
import { SoundHandler } from './modules/SoundHandler';
import TextHandler from './modules/TextHandler';
import Npc from './types/npc';

export class Game extends Container {
    app: Application;
    keyHandler: KeyboardHandler
    ws: WebSocket
    resources: Map<string, Resource[]>

    gameConfig: GameConfig

    worldContainer: Container

    npcContainer: Container
    textHandler: TextHandler
    tilemap: Tilemap

    player: Player
    soundHandler: SoundHandler
    tilemapHandler: TilemapHandler

    players: Map<number, Player>

    // includes all npcs related to the cell key
    npcs: Map<string, Npc[]>


    cursorSprite: Sprite
    cursorPos: Vector

    isEditing: boolean

    wsReady: boolean

    oldResourceLen: number

    sendCooldown: number

    inventoryStore: InventoryStore
    userStore: UserStore
    localStorageWrapper: LocalStorageWrapper

    constructor(app: Application, inventoryStore: InventoryStore, userStore: UserStore) {
        super();
        this.app = app;

        this.inventoryStore = inventoryStore
        this.userStore = userStore

        this.localStorageWrapper = new LocalStorageWrapper()

        this.isEditing = false
        this.resources = new Map()
        this.players = new Map()
        this.npcs = new Map()

        this.ws = new WebSocket(process.env.WS_API)

        this.ws.onerror = (error) => {
            console.log(error)
        }

        this.ws.onopen = () => {
            console.log("connected!")
            // Imediatly after websocket connection is opened
            this.ws.send(getLoginPlayerEvent(this.localStorageWrapper.uuid))
        }

        this.ws.onmessage = (m) => {
            if (typeof (m.data) != "string") {
                return
            }
            let parsed: any = JSON.parse(m.data)

            if (isMultipleEvents(parsed)) {
                parsed.events.forEach(e => this.processEvent(e))
            } else {
                this.processEvent(parsed)
            }
        }
    }

    processEvent(parsed: any) {
        if (isPlayerTargetPositionEvent(parsed)) {
            this.handlePlayerTargetPositionEvent(parsed)

        } else if (isLoadInventoryEvent(parsed)) {
            console.log("isLoadInventoryEvent")
            this.handleLoadInventoryEvent(parsed)

        } else if (isUpdateInventoryEvent(parsed)) {
            this.handleUpdateInventoryEvent(parsed)

        } else if (isUpdateResourceEvent(parsed)) {
            this.handleUpdateResourceEvent(parsed)

        } else if (isResourcePositionsEvent(parsed)) {
            this.handleAddResourceEvent(parsed)

        } else if (isRemovePlayerEvent(parsed)) {
            this.handleRemovePlayerEvent(parsed)

        } else if (isNewPlayerEvent(parsed)) {
            this.handleNewPlayerEvent(parsed)

        } else if (isAssignUserIdAndConfigEvent(parsed)) {
            console.log("isAssignUserIdAndConfigEvent")
            this.gameConfig = parsed.gameConfig
            this.initWorld()

            this.userStore.setLoading(false)
            this.handleAssignIdEvent(parsed)

        } else if (isRemoveGridCellEvent(parsed)) {
            this.handleRemoveGridCellEvent(parsed)

        } else if (isCellDataEvent(parsed)) {
            this.tilemapHandler.processCellDataEvent(parsed)

        } else if (isNpcListEvent(parsed)) {
            this.handleNpcListEvent(parsed)
        } else if (isNpcTargetPositionEvent(parsed)) {

            this.handleNpcTargetPositionEvent(parsed)
        } else if (isUpdateNpcEvent(parsed)) {
            this.handleUpdateNpcEvent(parsed)
        }
    }

    initWorld() {
        this.keyHandler = new KeyboardHandler()

        // container structurs
        this.worldContainer = new Container();
        this.worldContainer.sortableChildren = true
        this.worldContainer.zIndex = 1

        this.textHandler = new TextHandler()
        this.textHandler.textItemContainer.sortableChildren = true
        this.textHandler.textItemContainer.zIndex = 2

        this.tilemapHandler = new TilemapHandler(this.gameConfig)
        this.tilemapHandler.tilemapContainer.sortableChildren = true
        this.tilemapHandler.tilemapContainer.zIndex = 0

        this.npcContainer = new Container();
        this.npcContainer.sortableChildren = true
        this.npcContainer.zIndex = 4

        this.worldContainer.addChild(this.tilemapHandler.tilemapContainer)
        this.worldContainer.addChild(this.npcContainer)
        this.worldContainer.addChild(this.textHandler.textItemContainer)

        this.soundHandler = new SoundHandler()

        this.sendCooldown = 0


        this.player = new Player(-1, createVector(0, 0), getOwnPlayerSprite())

        this.cursorSprite = getCursorSprite(this.app.loader)
        this.player.spriteContainer.addChild(this.cursorSprite)

        this.cursorPos = createVector(0, 0)

        this.oldResourceLen = 0

        this.app.stage.interactive = true
        this.app.stage.on("pointermove", (e) => {
            const { x, y } = e.data.global

            this.cursorPos.x = x
            this.cursorPos.y = y


            const selectedResource = this.inventoryStore.selectedRecipe.buildResourceType
            if (selectedResource.length > 0) {
                this.cursorSprite.visible = true
                this.cursorSprite.texture = this.app.loader.resources[`assets/${selectedResource}.png`].texture
            } else {
                this.cursorSprite.visible = false
            }
        })

        this.app.stage.on("click", (e) => {
            const cX = this.cursorPos.x
            const cY = this.cursorPos.y
            // nothing selected -> return
            if (this.inventoryStore.selectedRecipe.buildResourceType.length === 0) return
            if (!this.inventoryStore.canBuildResource(this.inventoryStore.selectedRecipe)) return

            // Players cursor position relativ to players position and locked to world grid
            const pX = this.player.currentPos.x % 50
            const pY = this.player.currentPos.y % 50
            const x1 = Math.floor((cX + 25 + pX) / 50) * 50
            const y1 = Math.floor((cY + 25 + pY) / 50) * 50
            const x = -(SCREEN_SIZE / 2) + x1 - pX + this.player.currentPos.x
            const y = -(SCREEN_SIZE / 2) + y1 - pY + this.player.currentPos.y
            const spawn = createVector(Math.trunc(x), Math.trunc(y))
            this.ws.send(getPlayerPlacedResourceEvent("blockade", spawn))
        })


        this.addChild(this.worldContainer)
        this.addChild(getInventoryBackground())
        this.addChild(this.player.spriteContainer)


        this.update = this.update.bind(this);
        this.app.ticker.add(this.update);
    }


    // main update loop
    update(delta: number) {


        const fps = 60 / delta
        this.inventoryStore.setFrameRate(fps)

        this.textHandler.update()

        // Todo: Make this more efficient by only generating the array if resources have changed

        let allResources: Resource[] = []
        for (let k of this.resources.keys()) {
            allResources = [...allResources, ...this.resources.get(k)]
        }

        const currLength = allResources.length
        if (this.oldResourceLen != currLength) {
            this.oldResourceLen = currLength
            console.log(this.oldResourceLen)
            console.log("children on world container", this.worldContainer.children.length)
        }

        this.sendCooldown -= delta
        if (this.sendCooldown <= 0) {
            this.handleKeyBoard(this.keyHandler, this.player, this.ws, allResources)
            this.sendCooldown = 5
        }

        // update world container based on players position
        this.player.updatePosition()
        this.worldContainer.x = -this.player.currentPos.x + (SCREEN_SIZE / 2)
        this.worldContainer.y = -this.player.currentPos.y + (SCREEN_SIZE / 2)


        const pX = this.player.currentPos.x % 50
        const pY = this.player.currentPos.y % 50
        const cX = this.cursorPos.x
        const cY = this.cursorPos.y
        const x1 = Math.floor((cX + 25 + pX) / 50) * 50
        const y1 = Math.floor((cY + 25 + pY) / 50) * 50

        this.cursorSprite.position.x = x1 - pX
        this.cursorSprite.position.y = y1 - pY

        // update other players positions
        Array.from(this.players.values()).map(p => {
            p.updatePosition()
            p.sprite.x = p.currentPos.x
            p.sprite.y = p.currentPos.y
        })

        // update npc positions
        Array.from(this.npcs.values()).map(p => {
            p.map(npc => {
                npc.updatePosition()
                npc.container.x = npc.currentPos.x
                npc.container.y = npc.currentPos.y
            })
        })


        this.player.updateCooldown(delta)
    }

    handleAddResourceEvent(parsed: ResourcePositionsEvent) {
        parsed.resources.forEach(r => {
            const pos = createVector(r.pos.x, r.pos.y)
            const resource: Resource = new Resource(r.id, this.player, r.quantity, r.resourceType, pos, r.hitpoints, r.isSolid, this.app.loader, this.ws, r.isLootable)
            this.worldContainer.addChild(resource.container);

            const { gridCellKey } = r;
            if (this.resources.has(gridCellKey)) {
                const resources = this.resources.get(gridCellKey)
                resources.push(resource)
                this.resources.set(gridCellKey, resources)
            } else {
                // init new array if its a new cell
                this.resources.set(gridCellKey, [resource])
            }
        })
    }

    handleRemovePlayerEvent(parsed: RemovePlayerEvent) {
        const p = this.players.get(parsed.id)
        if (p) {
            this.worldContainer.removeChild(p.sprite)
            this.players.delete(parsed.id)
        }
    }

    handleRemoveGridCellEvent(parsed: RemoveGridCellEvent) {
        const { gridCellKey } = parsed
        if (this.resources.has(gridCellKey)) {
            this.resources.get(gridCellKey).map(r => {
                this.worldContainer.removeChild(r.container)
            })
        }

        this.tilemapHandler.handleRemove(gridCellKey, this.worldContainer)

        this.resources.delete(gridCellKey)

        // unsub from cell remove npcs form cell 

        this.npcs.get(gridCellKey).forEach(npc => {
            this.npcContainer.removeChild(npc.container)
        })
        this.npcs.delete(gridCellKey)
    }

    handlePlayerTargetPositionEvent(parsed: PlayerTargetPositionEvent) {
        if (parsed.id === this.player.id) {
            const newPos = createVector(parsed.pos.x, parsed.pos.y)
            if (newPos.dist(this.player.targetPos) > 1000) {
                console.log("hard update")
                // only update players target pos with server side pos if a threshold is exceeded
                this.player.targetPos = newPos
            }
        } else {
            const player = this.players.get(parsed.id)
            if (player) {
                player.targetPos = createVector(parsed.pos.x, parsed.pos.y)
            } else {
                const newP = new Player(parsed.id, createVector(parsed.pos.x, parsed.pos.y), getOtherPlayerSprite())
                this.worldContainer.addChild(newP.sprite)
                this.players.set(newP.id, newP)
            }
        }
    }

    handleNewPlayerEvent(parsed: NewPlayerEvent) {
        console.log("new player event")
        if (this.player.id === parsed.id) {
            // this.player.currentPos.x = parsed.pos.x
            // this.player.currentPos.y = parsed.pos.y
        } else {
            const existing = this.players.get(parsed.id)
            if (existing) {
                existing.targetPos = createVector(parsed.pos.x, parsed.pos.y)
                this.players.set(parsed.id, existing)
            } else {
                const newP = new Player(parsed.id, createVector(parsed.pos.x, parsed.pos.y), getOtherPlayerSprite())
                this.worldContainer.addChild(newP.sprite)
                this.players.set(newP.id, newP)
            }
        }
    }

    handleAssignIdEvent(parsed: AssignUserIdAndConfigEvent) {
        this.localStorageWrapper.setUUID(parsed.uuid)
        this.player.id = parsed.id
        this.player.currentPos.x = parsed.pos.x
        this.player.currentPos.y = parsed.pos.y
    }

    handleUpdateResourceEvent(parsed: UpdateResourceEvent) {
        let resources = this.resources.get(parsed.gridCellKey)

        const r = resources.find(r => r.id == parsed.id)
        if (r) {
            if (parsed.remove) {
                resources = resources.filter(rO => rO.id !== parsed.id)
            }

            if (r.hitPoints.current !== parsed.hitpoints.current) {
                this.soundHandler.hitResource(r.resourceType)
            }

            if (parsed.damage > 0) {
                // spawn damage text
                this.textHandler.addItem(`${parsed.damage}`, r.pos, "0xff0000")
            }

            r.hitPoints.current = parsed.hitpoints.current
            r.hitPoints.max = parsed.hitpoints.max
            r.updateHealthbar(r.container)

            if (r.hitPoints.current <= 0) {
                r.container.removeChild(r.sprite)
                this.removeChild(r.container)
            }

            this.resources.set(parsed.gridCellKey, resources)
        } else {
            console.log("resourcen not found", parsed.gridCellKey)
            console.log(this.resources)
            console.log(parsed.id)
        }
    }

    handleUpdateInventoryEvent(parsed: UpdateInventoryEvent) {
        const item: Item = {
            resourceType: parsed.item.resourceType,
            quantity: parsed.item.quantity
        }
        if (parsed.remove) {
            this.inventoryStore.itemBuild(item)
        } else {
            this.inventoryStore.addItem(item)
            const pos = this.player.targetPos.copy()
            pos.x -= 25
            pos.y -= 35
            this.textHandler.addItem(`${item.resourceType} +${item.quantity}`, pos, "0x1dff20")
        }
    }

    handleLoadInventoryEvent(parsed: LoadInventoryEvent) {
        Object.keys(parsed.items).forEach(k => {
            const { resourceType, quantity } = parsed.items[k]
            const item: Item = {
                resourceType: resourceType,
                quantity: quantity
            }
            this.inventoryStore.addItem(item)
        })
    }

    handleNpcListEvent(parsed: NpcListEvent) {
        const newNpcs: Npc[] = parsed.npcList.map(npc => {
            const n = new Npc(npc, this.ws, this.player)
            this.npcContainer.addChild(n.container)
            return n
        })
        this.npcs.set(parsed.gridCellKey, newNpcs)
    }

    handleNpcTargetPositionEvent(parsed: NpcTargetPositionEvent) {
        let npcs = this.npcs.get(parsed.gridCellKey)

        if (!npcs) {
            return
        }

        const npc = npcs.find(n => n.UUID === parsed.npcUUID)
        if (!npc) {
            return
        }

        npc.targetPos = createVector(parsed.pos.x, parsed.pos.y)
        npcs = npcs.filter(n => n.UUID !== parsed.npcUUID)
        npcs.push(npc)
        this.npcs.set(parsed.gridCellKey, npcs)
    }

    handleUpdateNpcEvent(parsed: UpdateNpcEvent) {
        console.log("handleUpdateNpcEvent", parsed)
        let npcs = this.npcs.get(parsed.gridCellKey)

        if (!npcs) {
            return
        }

        const npc = npcs.find(n => n.UUID === parsed.npcUUID)
        if (!npc) {
            return
        }

        npc.hitPoints.current = parsed.hitpoints.current
        npcs = npcs.filter(n => n.UUID !== parsed.npcUUID)
        if (parsed.remove) {
            this.npcContainer.removeChild(npc.container)
        } else {
            npcs.push(npc)
        }

        this.npcs.set(parsed.gridCellKey, npcs)

        npc.updateHealthbar(npc.container)
    }

    handleKeyBoard(keyHandler: KeyboardHandler, player: Player, ws: WebSocket, resources: Resource[]) {
        VALID_KEYS.forEach(key => {
            const value = keyHandler.keys.get(key)
            if (value == KeyStates.DOWN) {

                const newPos = player.targetPos.copy()

                switch (key) {
                    case "w":
                        newPos.y -= this.gameConfig.playerStepSize
                        break
                    case "a":
                        newPos.x -= this.gameConfig.playerStepSize
                        break
                    case "s":
                        newPos.y += this.gameConfig.playerStepSize
                        break
                    case "d":
                        newPos.x += this.gameConfig.playerStepSize
                        break
                }

                const hasCollision = resources.filter(r => r.isSolid).some(r => r.pos.dist(newPos) < 40)
                if (!hasCollision) {
                    player.targetPos = newPos
                    ws.send(getKeyBoardEvent(key, value))
                }
            }
        })
    }
}
