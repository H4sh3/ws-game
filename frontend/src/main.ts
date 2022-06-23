import { Application, Container, Sprite } from 'pixi.js';
import { isPlayerTargetPositionEvent, createVector, isUpdateResourceEvent, isResourcePositionsEvent, isRemovePlayerEvent, isNewPlayerEvent, isAssignUserIdEvent, KeyStates, getKeyBoardEvent, ResourcePositionsEvent, RemovePlayerEvent, PlayerTargetPositionEvent, NewPlayerEvent, AssignIdEvent, UpdateResourceEvent, getLootResourceEvent, getHitResourceEvent, getPlayerPlacedResourceEvent, isLoadInventoryEvent, isUpdateInventoryEvent, isRemoveGridCellEvent, RemoveGridCellEvent } from './events/events';
import { KeyboardHandler, VALID_KEYS } from './etc/KeyboardHandler';
import { Player } from './types/player';
import { Resource } from './types/resource';
import Vector from './types/vector';
import getBackgroundGraphics, { getInventoryBackground } from './sprites/background';
import { getOwnPlayerSprite } from './sprites/player';
import { getBlockadeSprite, getCursorSprite } from './sprites/etc';
import { SCREEN_SIZE } from './etc/const';
import { Inventory } from './types/inventory';

export class Game extends Container {
    app: Application;
    keyHandler: KeyboardHandler
    ws: WebSocket
    resources: Map<string, Resource[]>
    worldContainer: Container

    player: Player

    players: Map<number, Player>
    inventory: Inventory

    cursorSprite: Sprite
    blockadeSprite: Sprite

    cursorPos: Vector

    isEditing: boolean

    wsReady: boolean

    oldResourceLen: number


    constructor(app: Application) {
        super();
        this.app = app;

        this.ws = new WebSocket(process.env.WS_API)
        this.isEditing = false
        this.resources = new Map()
        this.players = new Map()
        this.inventory = new Inventory()

        this.worldContainer = new Container();
        this.keyHandler = new KeyboardHandler()
        this.update = this.update.bind(this);

        this.addChild(getBackgroundGraphics())

        this.player = new Player(-1, createVector(0, 0), getOwnPlayerSprite(app.loader))
        this.cursorSprite = getCursorSprite(app.loader)
        this.player.sprite.addChild(this.cursorSprite)

        this.cursorPos = createVector(0, 0)

        this.oldResourceLen = 0

        this.app.stage.interactive = true
        this.app.stage.on("pointermove", (e) => {
            const { x, y } = e.data.global
            this.cursorPos.x = x
            this.cursorPos.y = y
        })

        this.app.stage.on("click", (e) => {
            const cX = this.cursorPos.x
            const cY = this.cursorPos.y
            if (!this.isEditing || cY > SCREEN_SIZE - 100) return

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

        this.blockadeSprite = getBlockadeSprite(this)


        this.addChild(this.blockadeSprite)
        this.addChild(this.player.sprite)


        this.ws.onerror = (error) => {
            console.log(error)
        }

        this.ws.onopen = () => {
            console.log("connected!")
        }

        this.ws.onmessage = (m) => {
            if (typeof (m.data) != "string") {
                return
            }

            m.data.split("\n").forEach(message => {
                let parsed: any = JSON.parse(message)
                if (isPlayerTargetPositionEvent(parsed)) {
                    this.handlePlayerTargetPositionEvent(parsed)
                } else if (isLoadInventoryEvent(parsed)) {
                    this.inventory.initLoad(parsed.items, this.player, this.app.loader, this.ws)
                } else if (isUpdateInventoryEvent(parsed)) {
                    this.inventory.update(parsed, this.player, this.app.loader, this.ws)
                    this.inventory.log()
                } else if (isUpdateResourceEvent(parsed)) {
                    this.updateResourceEvent(parsed)
                } else if (isResourcePositionsEvent(parsed)) {
                    this.addResourceEvent(parsed)
                } else if (isRemovePlayerEvent(parsed)) {
                    this.handlePlayerDisconnect(parsed)
                } else if (isNewPlayerEvent(parsed)) {
                    this.handleNewPlayerEvent(parsed)
                } else if (isAssignUserIdEvent(parsed)) {
                    this.handleAssignIdEvent(parsed)
                } else if (isRemoveGridCellEvent(parsed)) {
                    this.handleRemoveGridCellEvent(parsed)
                }
            })
        }

        app.ticker.add(this.update);
    }


    // main update loop
    update(delta: number) {

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

        handleKeyBoard(this.keyHandler, this.player, this.ws, allResources)

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

        if (this.isEditing) {
            this.cursorSprite.x = -(SCREEN_SIZE / 2) + x1 - pX
            this.cursorSprite.y = -(SCREEN_SIZE / 2) + y1 - pY
        } else {
            this.cursorSprite.x = 0
            this.cursorSprite.y = SCREEN_SIZE - 50
        }

        // update other players positions
        Array.from(this.players.values()).map(p => {
            p.updatePosition()
            p.sprite.x = p.currentPos.x
            p.sprite.y = p.currentPos.y
        })


        this.player.updateCooldown(delta)
    }

    addResourceEvent(parsed: ResourcePositionsEvent) {
        parsed.resources.forEach(r => {
            const resource: Resource = new Resource(r.id, this.player, r.quantity, r.resourceType, createVector(r.pos.x, r.pos.y), r.hitpoints, r.isSolid, this.app.loader, this.ws, r.isLootable)
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

    handlePlayerDisconnect(parsed: RemovePlayerEvent) {
        const p = this.players.get(parsed.id)
        if (p) {
            this.worldContainer.removeChild(p.sprite)
            this.players.delete(parsed.id)
        }
    }

    handleRemoveGridCellEvent(parsed: RemoveGridCellEvent) {
        const { gridCellKey } = parsed
        if (this.resources.has(gridCellKey))
            this.resources.get(gridCellKey).map(r => {
                this.worldContainer.removeChild(r.container)
            })
        this.resources.delete(gridCellKey)
    }

    handlePlayerTargetPositionEvent(parsed: PlayerTargetPositionEvent) {
        if (parsed.id === this.player.id) {
            const newPos = createVector(parsed.pos.x, parsed.pos.y)
            if (newPos.dist(this.player.targetPos) > 1000) {
                // only update players target pos with server side pos if a threshold is exceeded
                this.player.targetPos = newPos
            }
        } else {
            const player = this.players.get(parsed.id)
            if (player) {
                player.targetPos = createVector(parsed.pos.x, parsed.pos.y)
            }
        }
    }

    handleNewPlayerEvent(parsed: NewPlayerEvent) {
        if (this.player.id === parsed.id) {
            this.player.currentPos.x = parsed.pos.x
            this.player.currentPos.y = parsed.pos.y
        } else {
            const existing = this.players.get(parsed.id)
            if (existing) {
                existing.targetPos = createVector(parsed.pos.x, parsed.pos.y)
                this.players.set(parsed.id, existing)
            } else {
                const sprite = new Sprite(this.app.loader.resources['assets/player0.png'].texture)
                sprite.anchor.set(0.5)
                const newP = new Player(parsed.id, createVector(parsed.pos.x, parsed.pos.y), sprite)
                this.worldContainer.addChild(sprite)
                this.players.set(newP.id, newP)
            }
        }
    }

    handleAssignIdEvent(parsed: AssignIdEvent) {
        this.player.id = parsed.id
    }

    updateResourceEvent(parsed: UpdateResourceEvent) {


        let resources = this.resources.get(parsed.gridCellKey)

        const r = resources.find(r => r.id == parsed.id)
        if (r) {
            if (parsed.remove) {
                resources = resources.filter(rO => rO.id !== parsed.id)
            }

            r.hitPoints.current = parsed.hitpoints.current
            r.hitPoints.max = parsed.hitpoints.max
            r.updateHealthbar()
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
}

function handleKeyBoard(keyHandler: KeyboardHandler, player: Player, ws: WebSocket, resources: Resource[]) {
    VALID_KEYS.forEach(key => {
        const value = keyHandler.keys.get(key)
        if (value == KeyStates.DOWN) {

            const newPos = player.targetPos.copy()

            const stepSize = 10

            switch (key) {
                case "w":
                    newPos.y -= stepSize
                    break
                case "a":
                    newPos.x -= stepSize
                    break
                case "s":
                    newPos.y += stepSize
                    break
                case "d":
                    newPos.x += stepSize
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