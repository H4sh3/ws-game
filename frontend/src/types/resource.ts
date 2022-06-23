import { Sprite, Graphics, Loader, Point, Container } from "pixi.js"
import { Hitpoints, getHitResourceEvent, getLootResourceEvent } from "../events/events"
import { Player } from "./player"
import Vector from "./vector"


export class Resource {
    id: number
    quantity: number
    pos: Vector
    hitPoints: Hitpoints
    isSolid: boolean
    isLootable: boolean
    resourceType: string
    player: Player
    ws: WebSocket

    // render stuff
    container: Container
    sprite: Sprite
    healthBar?: Graphics

    canDoAction?: () => boolean
    setCanDoAction?: (b: boolean) => void

    constructor(id: number, player: Player, quantity: number, resourceType: string, pos: Vector, hp: Hitpoints, isSolid: boolean, loader: Loader, ws: WebSocket, isLootable: boolean, canDoAction: () => boolean = () => { return true }, setCanDoAction: (b: boolean) => void = () => { }) {
        this.canDoAction = canDoAction
        this.setCanDoAction = setCanDoAction
        this.id = id
        this.ws = ws
        this.player = player
        this.quantity = quantity
        this.pos = pos
        this.hitPoints = {
            current: hp.current,
            max: hp.max
        }
        this.isSolid = isSolid
        this.isLootable = isLootable
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
            if (!this.isLootable && !this.player.canDoAction()) {
                return
            }
            if (this.pos.dist(this.player.currentPos) < 150) {
                if (this.isLootable) {
                    this.ws.send(getLootResourceEvent(this.id))
                } else {
                    // is hitable
                    this.ws.send(getHitResourceEvent("1", this.id))
                }
            }
        });

        this.sprite.on('mouseover', () => {
            if (this.pos.dist(this.player.currentPos) > 150) return
            this.sprite.scale.x = 1.1
            this.sprite.scale.y = 1.1
        });

        this.sprite.on('mouseout', () => {
            this.sprite.scale.x = 1
            this.sprite.scale.y = 1
        });
    }

    updateHealthbar() {
        if (this.healthBar) {
            this.container.removeChild(this.healthBar)
        }
        if (this.hitPoints.current === this.hitPoints.max || this.hitPoints.current <= 0) {
            return
        }

        const width = 50
        this.healthBar = new Graphics();

        this.healthBar.beginFill(0xcccccc);
        this.healthBar.drawRect(-25, -20, width, 10);
        this.healthBar.endFill();

        this.healthBar.beginFill(0x00ff00);
        this.healthBar.drawRect(-25, -20, width * (this.hitPoints.current / this.hitPoints.max), 10);
        this.healthBar.endFill();

        this.healthBar.lineStyle(2, 0x666666, 1);
        this.healthBar.drawRect(-25, -20, width, 10);
        this.healthBar.endFill();

        this.container.addChild(this.healthBar)
    }
}