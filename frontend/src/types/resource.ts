import { Sprite, Graphics, Loader, Container, Text } from "pixi.js"
import { RESOURCE_SCALE } from "../etc/const"
import { randInt } from "../etc/math"
import { Hitpoints, getHitResourceEvent, getLootResourceEvent } from "../events/events"
import { Game } from "../main"
import { getTextureFromResourceType, itemTextures } from "../modules/ResourceHandler"
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
    healthBarOffsetY?: number
    text: Text

    constructor(hitpoints: Hitpoints, healthBarOffsetY = -20) {
        this.hitPoints = hitpoints
        this.healthBarOffsetY = healthBarOffsetY
    }

    updateHealthbar(container: Container) {
        if (this.healthBar) {
            this.healthBar.destroy()
            container.removeChild(this.healthBar)
        }

        if (this.text) {
            this.text.destroy()
            container.removeChild(this.text)
        }

        if (this.hitPoints.current === this.hitPoints.max || this.hitPoints.current <= 0) {
            return
        }

        const width = 50

        this.healthBar = new Graphics();

        this.healthBar.beginFill(0xcccccc);
        this.healthBar.drawRect(-25, this.healthBarOffsetY, width, 14);
        this.healthBar.endFill();

        this.healthBar.beginFill(0x00ff00);
        this.healthBar.drawRect(-25, this.healthBarOffsetY, width * (this.hitPoints.current / this.hitPoints.max), 14);
        this.healthBar.endFill();

        this.healthBar.lineStyle(2, 0x666666, 1);
        this.healthBar.drawRect(-25, this.healthBarOffsetY, width, 14);
        this.healthBar.endFill();

        container.addChild(this.healthBar)

        let hpValue = this.hitPoints.current
        let greater1k = false
        if (hpValue > 1000) {
            greater1k = true
            hpValue /= 1000
            hpValue = Math.floor(hpValue)
        }

        this.text = new Text(`${hpValue}${greater1k ? 'k' : ""}`, { fontFamily: 'Arial Black', fontSize: 12, fill: 0x000000, align: 'center' });
        this.text.position.set(-22, 1 + this.healthBarOffsetY)
        container.addChild(this.text)
    }
}



export interface IsClickable {
    pos: Vector,
    gotClicked: () => string
}

export class Resource extends HasHitpoints implements IsClickable {
    id: number
    quantity: number
    gridCellKey: string
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

    constructor(gridCellKey: string, id: number, quantity: number, resourceType: string, pos: Vector, hp: Hitpoints, isSolid: boolean, isLootable: boolean, game: Game, canDoAction: () => boolean = () => { return true }, setCanDoAction: (b: boolean) => void = () => { }) {
        super(hp)

        this.gridCellKey = gridCellKey

        this.canDoAction = canDoAction
        this.setCanDoAction = setCanDoAction
        this.id = id
        this.ws = game.ws
        this.player = game.player
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
                this.sprite = new Sprite(game.app.loader.resources[`assets/${this.resourceType}1.png`].texture)
            } else {
                this.sprite = new Sprite(game.app.loader.resources[`assets/${this.resourceType}2.png`].texture)
            }
            this.sprite.scale.set(2, 2)
        } else {
            this.sprite = new Sprite(getTextureFromResourceType(this.resourceType))
            this.sprite.scale.set(RESOURCE_SCALE, RESOURCE_SCALE)
        }

        this.sprite.interactive = true
        this.sprite.anchor.set(0.5)
        this.container.addChild(this.sprite)

        this.updateHealthbar(this.container)

        this.sprite.on('mouseover', () => {
            game.hoveredElement = this
        });


        this.sprite.on('mouseout', () => {
            game.hoveredElement = undefined
        })
    }

    gotClicked(): string {
        if (this.isLootable) {
            return getLootResourceEvent(this.id)
        } else {
            // is hitable
            return getHitResourceEvent("1", this.id)
        }
    }


}