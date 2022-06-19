import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { isPlayerTargetPositionEvent, createVector, isUpdateResourceEvent, isResourcePositionsEvent, isPlayerDisconnectedEvent, isNewPlayerEvent, isAssignUserIdEvent, KeyStates, getKeyBoardEvent, ResourcePositionsEvent, PlayerDisconnectedEvent, PlayerTargetPositionEvent, NewPlayerEvent, AssignIdEvent, UpdateResourceEvent, getLootResourceEvent, getHitResourceEvent, getPlayerPlacedResourceEvent } from './events/events';
import { KeyboardHandler, VALID_KEYS } from './etc/KeyboardHandler';
import { Player } from './types/player';
import { Resource } from './types/resource';
import Vector from './types/vector';

export class Game extends Container {
    app: Application;
    keyHandler: KeyboardHandler
    ws: WebSocket
    resources: Resource[]
    worldContainer: Container

    player: Player

    players: Map<number, Player>

    cursorSprite: Sprite
    blockadeSprite: Sprite

    cursorPos: Vector

    isEditing: boolean

    constructor(app: Application) {
        super();
        this.app = app;

        const background = new Graphics();
        background.beginFill(0x2BB130);
        background.drawRect(0, 0, 500, 500);
        background.endFill();

        this.isEditing = false

        this.addChild(background)
        this.update = this.update.bind(this);

        this.keyHandler = new KeyboardHandler()

        this.ws = new WebSocket(process.env.WS_API)
        this.worldContainer = new Container();
        this.resources = []

        const playerSprite = new Sprite(app.loader.resources['assets/player0.png'].texture)
        playerSprite.x = 250
        playerSprite.y = 250
        playerSprite.anchor.set(0.5)
        this.player = new Player(-1, createVector(0, 0), playerSprite)

        this.cursorSprite = new Sprite(app.loader.resources['assets/cursor.png'].texture)
        this.cursorSprite.anchor.set(0.5)
        this.cursorSprite.x = 0
        this.cursorSprite.y = 445
        playerSprite.addChild(this.cursorSprite)

        const inventoryBackground = new Graphics()
        inventoryBackground.beginFill(0xCCCCCC);
        inventoryBackground.lineStyle(2, 0x666666, 1);
        inventoryBackground.drawRect(0, 440, 500, 60);
        inventoryBackground.endFill();

        this.cursorPos = createVector(0, 0)

        this.app.stage.interactive = true
        this.app.stage.on("pointermove", (e) => {
            const { x, y } = e.data.global
            this.cursorPos.x = x
            this.cursorPos.y = y
        })

        this.app.stage.on("click", (e) => {
            const cX = this.cursorPos.x
            const cY = this.cursorPos.y
            if (!this.isEditing || cY > 400) return

            const pX = this.player.currentPos.x % 50
            const pY = this.player.currentPos.y % 50
            const x1 = Math.floor((cX + 25 + pX) / 50) * 50
            const y1 = Math.floor((cY + 25 + pY) / 50) * 50
            const x = -250 + x1 - pX + this.player.currentPos.x
            const y = -250 + y1 - pY + this.player.currentPos.y
            const spawn = createVector(Math.trunc(x), Math.trunc(y))
            this.ws.send(getPlayerPlacedResourceEvent("blockade", spawn))
        })



        this.players = new Map()

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
                } else if (isUpdateResourceEvent(parsed)) {
                    this.updateResourceEvent(parsed)
                } else if (isResourcePositionsEvent(parsed)) {
                    this.handleResourceEvent(parsed)
                } else if (isPlayerDisconnectedEvent(parsed)) {
                    this.handlePlayerDisconnect(parsed)
                } else if (isNewPlayerEvent(parsed)) {
                    this.handleNewPlayerEvent(parsed)
                } else if (isAssignUserIdEvent(parsed)) {
                    this.handleAssignIdEvent(parsed)
                }
            })
        }
        this.addChild(this.worldContainer)

        // render loop
        app.ticker.add(this.update);

        this.addChild(inventoryBackground)
        this.blockadeSprite = new Sprite(app.loader.resources['assets/blockade.png'].texture)
        this.blockadeSprite.x = 5
        this.blockadeSprite.y = 445
        this.blockadeSprite.interactive = true
        this.blockadeSprite.on("click", () => {
            this.isEditing = !this.isEditing
            if (this.isEditing) {
                this.cursorSprite.texture = app.loader.resources['assets/blockade.png'].texture
                this.blockadeSprite.texture = app.loader.resources['assets/cursor.png'].texture
            } else {
                this.cursorSprite.texture = app.loader.resources['assets/cursor.png'].texture
                this.blockadeSprite.texture = app.loader.resources['assets/blockade.png'].texture
            }
        })

        this.addChild(this.blockadeSprite)

        this.addChild(this.player.sprite)
    }

    update(delta: number) {
        handleKeyBoard(this.keyHandler, this.player, this.ws, this.resources)

        // update world container based on players position
        this.player.updatePosition()
        this.worldContainer.x = -this.player.currentPos.x + 250
        this.worldContainer.y = -this.player.currentPos.y + 250

        const pX = this.player.currentPos.x % 50
        const pY = this.player.currentPos.y % 50
        const cX = this.cursorPos.x
        const cY = this.cursorPos.y
        const x1 = Math.floor((cX + 25 + pX) / 50) * 50
        const y1 = Math.floor((cY + 25 + pY) / 50) * 50

        if (this.isEditing) {
            this.cursorSprite.x = -250 + x1 - pX
            this.cursorSprite.y = -250 + y1 - pY
        } else {
            this.cursorSprite.x = 0
            this.cursorSprite.y = 450
        }

        // update other players positions
        Array.from(this.players.values()).map(p => {
            p.updatePosition()
            p.sprite.x = p.currentPos.x
            p.sprite.y = p.currentPos.y
        })
    }

    handleResourceEvent(parsed: ResourcePositionsEvent) {
        parsed.resources.forEach(r => {
            const resource: Resource = new Resource(r.id, this.player, r.quantity, r.resourceType, createVector(r.pos.x, r.pos.y), r.hitpoints, r.isSolid, this.app.loader, this.ws, r.isLootable)
            this.resources.push(resource)
            this.worldContainer.addChild(resource.container);
        })
    }

    handlePlayerDisconnect(parsed: PlayerDisconnectedEvent) {
        const p = this.players.get(parsed.id)
        if (p) {
            this.worldContainer.removeChild(p.sprite)
            this.players.delete(parsed.id)
        }
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
                player.targetPos.x = parsed.pos.x
                player.targetPos.y = parsed.pos.y
            }
        }
    }

    handleNewPlayerEvent(parsed: NewPlayerEvent) {
        if (this.player.id === parsed.id) {
            this.player.currentPos.x = parsed.pos.x
            this.player.currentPos.y = parsed.pos.y
        } else {
            const sprite = new Sprite(this.app.loader.resources['assets/player0.png'].texture)
            sprite.anchor.set(0.5)
            const newP = new Player(parsed.id, createVector(parsed.pos.x, parsed.pos.y), sprite)
            this.worldContainer.addChild(sprite)
            this.players.set(newP.id, newP)
        }
    }

    handleAssignIdEvent(parsed: AssignIdEvent) {
        this.player.id = parsed.id
    }

    updateResourceEvent(parsed: UpdateResourceEvent) {
        const r = this.resources.find(r => r.id == parsed.id)
        if (r) {

            if (parsed.remove) {
                this.resources = this.resources.filter(rO => rO.id !== parsed.id)
            }

            r.hitPoints.current = parsed.hitpoints.current
            r.hitPoints.max = parsed.hitpoints.max
            r.updateHealthbar()
            if (r.hitPoints.current <= 0) {
                r.container.removeChild(r.sprite)
                this.removeChild(r.container)
            }
        }
    }
}

function handleKeyBoard(keyHandler: KeyboardHandler, player: Player, ws: WebSocket, resources: Resource[]) {
    VALID_KEYS.forEach(key => {
        const value = keyHandler.keys.get(key)
        if (value == KeyStates.DOWN) {

            const newPos = player.targetPos.copy()

            const stepSize = 5

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