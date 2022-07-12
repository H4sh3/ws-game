import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { isPlayerTargetPositionEvent, createVector, isUpdateResourceEvent, isResourcePositionsEvent, isRemovePlayerEvent, isNewPlayerEvent, KeyStates, getKeyBoardEvent, ResourcePositionsEvent, RemovePlayerEvent, PlayerTargetPositionEvent, NewPlayerEvent, UserInitEvent, UpdateResourceEvent, getPlayerPlacedResourceEvent, isLoadInventoryEvent, isUpdateInventoryEvent, isRemoveGridCellEvent, RemoveGridCellEvent, isMultipleEvents, getLoginPlayerEvent, isCellDataEvent, UpdateInventoryEvent, LoadInventoryEvent, isNpcListEvent, NpcListEvent, isNpcTargetPositionEvent, NpcTargetPositionEvent, isUserInitEvent, GameConfig, isUpdateNpcEvent, UpdateNpcEvent, isUpdatePlayerEvent, UpdatePlayerEvent, isNpcAttackAnimEvent } from './events/events';
import { Player } from './types/player';
import Vector from './types/vector';
import { getOtherPlayerSprite, getOwnPlayerSprite } from './sprites/player';
import { getCursorSprite } from './sprites/etc';
import { SCREEN_SIZE } from './etc/const';
import { InventoryStore, Item } from './inventoryStore'

import { UserStore } from './userStore';
import { LocalStorageWrapper } from './localStorageWrapper';
import TilemapHandler from './modules/TilemapHandler';
import { KeyboardHandler } from './modules/KeyboardHandler';
import { SoundHandler } from './modules/SoundHandler';
import TextHandler from './modules/TextHandler';
import NpcHandler from './modules/NpcHandler';
import ResourceHandler from './modules/ResourceHandler';
import MiniMapHandler from './modules/MinimapHandler';

export class Game extends Container {
    app: Application;
    keyHandler: KeyboardHandler
    ws: WebSocket

    gameConfig: GameConfig

    worldContainer: Container

    textHandler: TextHandler
    tilemapHandler: TilemapHandler
    soundHandler: SoundHandler
    npcHandler: NpcHandler
    resourceHandler: ResourceHandler
    miniMapHandler: MiniMapHandler

    player: Player
    players: Map<number, Player>


    cursorSprite: Sprite
    cursorPos: Vector


    inventoryStore: InventoryStore
    userStore: UserStore
    localStorageWrapper: LocalStorageWrapper

    constructor(app: Application, inventoryStore: InventoryStore, userStore: UserStore) {
        super();
        this.app = app;

        this.inventoryStore = inventoryStore
        this.userStore = userStore

        this.localStorageWrapper = new LocalStorageWrapper()

        this.players = new Map()

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

    initWorld() {
        this.keyHandler = new KeyboardHandler()
        this.soundHandler = new SoundHandler()
        this.miniMapHandler = new MiniMapHandler(this.player.currentPos)

        // container structurs
        this.worldContainer = new Container();
        this.worldContainer.sortableChildren = true

        this.tilemapHandler = new TilemapHandler(this.gameConfig)
        this.tilemapHandler.container.zIndex = 0

        this.resourceHandler = new ResourceHandler();
        this.resourceHandler.container.zIndex = 1

        this.npcHandler = new NpcHandler()
        this.npcHandler.container.zIndex = 2

        this.textHandler = new TextHandler()
        this.textHandler.container.zIndex = 3


        // add handler containers
        this.worldContainer.addChild(this.tilemapHandler.container)
        this.worldContainer.addChild(this.npcHandler.container)
        this.worldContainer.addChild(this.textHandler.container)


        this.addChild(this.worldContainer)
        // player is centered in the middle of the game -> disentangled from the world
        this.addChild(this.miniMapHandler.container)
        this.addChild(this.player.spriteContainer)

        this.cursorPos = createVector(0, 0)

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

            // cant build -> return
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

        // bind update function
        this.update = this.update.bind(this);

        // start game loop -> ticker
        this.app.ticker.add(this.update);
    }


    // Todo write short description of events
    processEvent(parsed: any) {
        if (isPlayerTargetPositionEvent(parsed)) {

            this.handlePlayerTargetPositionEvent(parsed)
        } else if (isLoadInventoryEvent(parsed)) {

            this.handleLoadInventoryEvent(parsed)
        } else if (isUpdateInventoryEvent(parsed)) {

            this.handleUpdateInventoryEvent(parsed)
        } else if (isUpdateResourceEvent(parsed)) {

            this.resourceHandler.handleUpdateResourceEvent(parsed, this)
        } else if (isResourcePositionsEvent(parsed)) {

            this.resourceHandler.handleAddResourceEvent(parsed, this)
        } else if (isRemovePlayerEvent(parsed)) {

            this.handleRemovePlayerEvent(parsed)
        } else if (isNewPlayerEvent(parsed)) {

            this.handleNewPlayerEvent(parsed)
        } else if (isUserInitEvent(parsed)) {

            this.handleUserInitEvent(parsed)
        } else if (isRemoveGridCellEvent(parsed)) {

            this.handleRemoveGridCellEvent(parsed)
        } else if (isCellDataEvent(parsed)) {

            this.miniMapHandler.addTiles(parsed)
            this.tilemapHandler.processCellDataEvent(parsed)
        } else if (isNpcListEvent(parsed)) {

            this.npcHandler.handleNpcListEvent(parsed, this)
        } else if (isNpcTargetPositionEvent(parsed)) {

            this.npcHandler.handleNpcTargetPositionEvent(parsed)
        } else if (isUpdateNpcEvent(parsed)) {

            const pos = this.npcHandler.handleUpdateNpcEvent(parsed)
            this.textHandler.addItem(`-${parsed.damage}`, pos, "0xff0000")
        } else if (isUpdatePlayerEvent(parsed)) {

            this.handleUpdatePlayerEvent(parsed)
        } else if (isNpcAttackAnimEvent(parsed)) {
            console.log(parsed)
            this.npcHandler.handleNpcAttackAnimEvent(parsed)
        }
    }

    // main update loop
    update(delta: number) {
        const fps = 60 / delta
        this.inventoryStore.setFrameRate(fps)

        this.textHandler.update()

        this.keyHandler.handleKeyBoard(delta, this)

        // update world container based on players position
        this.player.updatePosition()
        this.worldContainer.x = -this.player.currentPos.x + (SCREEN_SIZE / 2)
        this.worldContainer.y = -this.player.currentPos.y + (SCREEN_SIZE / 2)

        this.miniMapHandler.update(this.player.currentPos, this.gameConfig.gridCellSize, this.gameConfig.subCells)

        // Translates cursor to relativ player position and grid
        const pX = this.player.currentPos.x % 50
        const pY = this.player.currentPos.y % 50
        const cX = this.cursorPos.x
        const cY = this.cursorPos.y
        const x1 = Math.floor((cX + 25 + pX) / 50) * 50
        const y1 = Math.floor((cY + 25 + pY) / 50) * 50
        this.cursorSprite.position.x = x1 - pX - SCREEN_SIZE / 2
        this.cursorSprite.position.y = y1 - pY - SCREEN_SIZE / 2

        // update other players positions
        Array.from(this.players.values()).map(p => {
            p.updatePosition()
        })

        // update npc positions
        this.npcHandler.update()


        this.player.updateCooldown(delta)
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

        this.resourceHandler.removeGridCellResources(gridCellKey, this)

        this.tilemapHandler.removeGridCellTiles(gridCellKey, this.worldContainer)

        this.npcHandler.removeGridCellNpcs(gridCellKey)
    }

    handlePlayerTargetPositionEvent(parsed: PlayerTargetPositionEvent) {
        if (parsed.id === this.player.id) {
            const newPos = createVector(parsed.pos.x, parsed.pos.y)
            if (newPos.dist(this.player.targetPos) > 1000 || parsed.force) {
                // only update players target pos with server side pos if a threshold is exceeded
                this.player.targetPos = newPos
            }
        } else {
            const player = this.players.get(parsed.id)
            if (player) {
                player.targetPos = createVector(parsed.pos.x, parsed.pos.y)
            } else {
                // this should probably not happend -> if we can't find a player that should be updated, request it from the server
                // Todo: implement feature that requests a player by his id

                //const newP = new Player(parsed.id, createVector(parsed.pos.x, parsed.pos.y), getOtherPlayerSprite())
                //this.worldContainer.addChild(newP.sprite)
                //this.players.set(newP.id, newP)
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
                const newP = new Player(parsed.id, createVector(parsed.pos.x, parsed.pos.y), getOtherPlayerSprite(), parsed.hitpoints)
                this.worldContainer.addChild(newP.spriteContainer)
                this.players.set(newP.id, newP)

                newP.updateHealthbar(newP.spriteContainer)
            }
        }
    }

    handleUserInitEvent(parsed: UserInitEvent) {
        // own player + sprite etc.
        this.localStorageWrapper.setUUID(parsed.uuid)
        this.player = new Player(parsed.id, createVector(SCREEN_SIZE / 2, SCREEN_SIZE / 2), getOwnPlayerSprite(), parsed.hitpoints, false)

        this.player.currentPos.x = parsed.pos.x
        this.player.currentPos.y = parsed.pos.y

        this.player.spriteContainer.sortableChildren = true
        this.player.spriteContainer.zIndex = 4
        this.cursorSprite = getCursorSprite(this.app.loader)
        this.player.spriteContainer.addChild(this.cursorSprite)
        this.player.updateHealthbar(this.player.spriteContainer)

        this.gameConfig = parsed.gameConfig

        this.initWorld()


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

    handleUpdatePlayerEvent(event: UpdatePlayerEvent) {
        const { playerId, hitpoints } = event

        const spawnText = (pos: Vector) => {
            pos.y -= 50

            if (event.damage > 0) {
                this.soundHandler.playerPlayerHit()
                this.textHandler.addItem(`-${event.damage}`, pos, '0xff0000', event.crit)
            }

            if (event.heal > 0) {
                this.textHandler.addItem(`+${event.heal}`, pos, '0x00ff00', event.crit)
            }
        }

        if (this.player.id == playerId) {

            this.player.updateHitpoints(hitpoints)
            this.player.updateHealthbar(this.player.spriteContainer)


            spawnText(this.player.currentPos.copy())

        } else {
            const player = this.players.get(playerId)
            if (player) {
                player.updateHitpoints(hitpoints)
                this.players.set(player.id, player)
                player.updateHealthbar(player.spriteContainer)
                spawnText(player.currentPos.copy())
            }
        }

    }

}
