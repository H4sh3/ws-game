import { Sprite, Graphics, Loader, Container } from "pixi.js"
import { randInt } from "../etc/math"
import { Hitpoints, getHitResourceEvent, getLootResourceEvent } from "../events/events"
import { Player } from "./player"
import Vector from "./vector"


// Todo: Sync these with backend
export enum ResourceTypes {
    Stone = "stone",
    Brick = "brick",
    Tree = "tree",
    Log = "log",
    Blockade = "blockade",
    IronOre = "ironOre",
}

export class HasHitpoints {
    hitPoints: Hitpoints
    healthBar?: Graphics

    constructor(hitpoints: Hitpoints) {
        this.hitPoints = hitpoints
    }

    updateHealthbar(container: Container) {
        if (this.healthBar) {
            container.removeChild(this.healthBar)
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

        container.addChild(this.healthBar)
    }
}

export class Resource extends HasHitpoints {
    id: number
    quantity: number
    pos: Vector
    isSolid: boolean
    isLootable: boolean
    resourceType: string
    player: Player
    ws: WebSocket

    // render stuff
    container: Container
    sprite: Sprite

    canDoAction?: () => boolean
    setCanDoAction?: (b: boolean) => void

    constructor(id: number, player: Player, quantity: number, resourceType: string, pos: Vector, hp: Hitpoints, isSolid: boolean, loader: Loader, ws: WebSocket, isLootable: boolean, canDoAction: () => boolean = () => { return true }, setCanDoAction: (b: boolean) => void = () => { }) {
        super(hp)

        this.canDoAction = canDoAction
        this.setCanDoAction = setCanDoAction
        this.id = id
        this.ws = ws
        this.player = player
        this.quantity = quantity
        this.pos = pos
        this.isSolid = isSolid
        this.isLootable = isLootable
        this.resourceType = resourceType
        this.container = new Container()
        this.container.x = this.pos.x
        this.container.y = this.pos.y

        if (this.resourceType == "tree") {
            if (randInt(1, 10) > 5) {
                this.sprite = new Sprite(loader.resources[`assets/${this.resourceType}1.png`].texture)
            } else {
                this.sprite = new Sprite(loader.resources[`assets/${this.resourceType}2.png`].texture)
            }
            this.sprite.scale.set(2, 2)
        } else {
            this.sprite = new Sprite(loader.resources[`assets/${this.resourceType}.png`].texture)
        }

        this.sprite.interactive = true
        this.sprite.anchor.set(0.5)
        this.container.addChild(this.sprite)

        this.updateHealthbar(this.container)


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
        });

        this.sprite.on('mouseout', () => {
        });
    }


}