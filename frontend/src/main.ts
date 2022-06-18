import { Application, Container, Graphics, InteractionEvent, Loader, Point, Sprite } from 'pixi.js';
import { isPlayerTargetPositionEvent, createVector, isUpdateResourceEvent, isResourcePositionsEvent, isPlayerDisconnectedEvent, isNewPlayerEvent, isAssignUserIdEvent, KeyStates, getKeyBoardEvent, ResourcePositionsEvent, PlayerDisconnectedEvent, PlayerTargetPositionEvent, NewPlayerEvent, AssignIdEvent, getHitResourceEvent, UpdateResourceEvent, Hitpoints, IResource } from './events/events';
import { KeyboardHandler, VALID_KEYS } from './etc/KeyboardHandler';
import { Player } from './types/player';
import Vector from './types/vector';


class Resource {
    id: number
    pos: Vector
    hitPoints: Hitpoints
    isSolid: boolean
    resourceType: string

    // render stuff
    container: Container
    sprite: Sprite
    healthBar?: Graphics
    healthBarBase?: Graphics

    constructor(id: number, resourceType: string, pos: Vector, hp: number, isSolid: boolean, loader: Loader, ws: WebSocket) {
        this.id = id
        this.pos = pos
        this.hitPoints = {
            current: hp,
            max: hp
        }
        this.isSolid = isSolid
        this.resourceType = resourceType


        this.container = new Container()
        this.container.x = this.pos.x
        this.container.y = this.pos.y
        this.sprite = new Sprite(loader.resources[`assets/${this.resourceType}.png`].texture)
        this.container.addChild(this.sprite)

        this.updateHealthbar()

        this.sprite.interactive = true

        this.sprite.anchor.set(0.5)
        this.sprite.on('click', () => {
            ws.send(getHitResourceEvent("1", this.id))
        });

        this.sprite.on('mouseover', () => {
            const scale = new Point(1.1, 1.1)
            this.sprite.scale = scale
        });

        this.sprite.on('mouseout', () => {
            const scale = new Point(1, 1)
            this.sprite.scale = scale
        });
    }

    updateHealthbar() {
        if (this.hitPoints.current === this.hitPoints.max) {
            return
        }
        const width = 50
        if (this.healthBar) {
            this.container.removeChild(this.healthBar)
        }
        this.healthBar = new Graphics();
        this.healthBar.lineStyle(2, 0x666666, 1);
        //this.healthBar.beginFill(0xCCCCCC);
        this.healthBar.drawRect(-25, -20, width, 10);
        this.healthBar.endFill();

        if (this.healthBarBase) {
            this.container.removeChild(this.healthBarBase)
        }
        this.healthBarBase = new Graphics();
        this.healthBarBase.beginFill(0x00ff00);
        this.healthBarBase.drawRect(-25, -20, width * (this.hitPoints.current / this.hitPoints.max), 10);
        this.healthBarBase.endFill();
        this.container.addChild(this.healthBarBase)
        this.container.addChild(this.healthBar)
    }
}

export class Game extends Container {
    app: Application;
    keyHandler: KeyboardHandler
    ws: WebSocket
    resources: Resource[]
    worldContainer: Container

    player: Player

    players: Map<number, Player>

    constructor(app: Application) {
        super();
        this.app = app;
        this.update = this.update.bind(this);

        this.keyHandler = new KeyboardHandler()

        this.ws = new WebSocket("ws://localhost:7777")
        this.worldContainer = new Container();
        this.resources = []

        this.player = new Player(-1, createVector(0, 0), new Sprite(app.loader.resources['assets/player0.png'].texture))
        this.player.sprite.x = 250
        this.player.sprite.y = 250
        this.player.sprite.anchor.set(0.5)


        this.addChild(this.player.sprite)

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
    }

    update(delta: number) {
        handleKeyBoard(this.keyHandler, this.player, this.ws, this.resources)

        // update world container based on players position
        this.player.updatePosition()
        this.worldContainer.x = -this.player.currentPos.x + 250
        this.worldContainer.y = -this.player.currentPos.y + 250

        // update other players positions
        Array.from(this.players.values()).map(p => {
            p.updatePosition()
            p.sprite.x = p.currentPos.x
            p.sprite.y = p.currentPos.y
        })
    }

    handleResourceEvent(parsed: ResourcePositionsEvent) {
        parsed.resources.forEach(r => {

            const container = new Container()
            container.x = r.pos.x
            container.y = r.pos.y
            const sprite = new Sprite(this.app.loader.resources['assets/stone.png'].texture)
            container.addChild(sprite)

            const hpBar = new Graphics();
            // Rectangle
            hpBar.lineStyle(2, 0xFEEB77, 1);
            hpBar.beginFill(0xff0000);
            hpBar.drawRect(0, -10, 50, 10);
            hpBar.endFill();
            container.addChild(hpBar)


            const resource: Resource = new Resource(r.id, r.resourceType, createVector(r.pos.x, r.pos.y), r.hitpoints.max, r.isSolid, this.app.loader, this.ws)
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
            this.player.targetPos.x = parsed.pos.x
            this.player.targetPos.y = parsed.pos.y
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
            r.hitPoints.current = parsed.hitpoints.current
            r.hitPoints.max = parsed.hitpoints.max
            r.updateHealthbar()
            if (r.hitPoints.current <= 0) {
                if (r.healthBar && r.healthBarBase) {
                    r.container.removeChild(r.healthBar)
                    r.container.removeChild(r.healthBarBase)
                }
                r.container.removeChild(r.sprite)
                this.removeChild(r.container)

                this.resources.filter(r => r.id !== r.id)
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