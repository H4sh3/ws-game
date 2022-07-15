import { Container, Graphics, Sprite, Text } from "pixi.js"
import { createVector, getPlayerClickedGroundItemEvent, getPlayerClickedInventoryItemEvent } from "../events/events"
import { getTextureFromResourceType } from "../modules/ResourceHandler"
import Vector, { IVector } from "./vector"

export interface Boni {
    attribute: string
    value: number
}

// item interface from websocket -> on load
export interface IItem {
    gridCellPos: IVector
    itemType: ItemType
    itemSubType: string
    pos: IVector
    uuid: string
    quantity: number

    rarity: RarityTypes
    quality: number
    minDamage: number
    maxDamage: number
    absorb: number
    attackSpeed: number

    boni: Boni[]
}

// item object used in client for visualization with pixijs sprites

type WeaponType = "weaponItem"
type ArmourType = "armourItem"
type ConsumableType = "consumableItem"
type ItemType = WeaponType | ArmourType | ConsumableType

type NormalRarity = "normal" // 50%
type MagicRarity = "magic"  // 80%
type UniqueRarity = "unique" // 9%
type UltraRarity = "ultra"  // 1%
type RarityTypes = NormalRarity | MagicRarity | UniqueRarity | UltraRarity

const getRarityColorFromText = (rarity: RarityTypes): number => {
    if (rarity == "normal") {
        return 0x969696
    } else if (rarity == "magic") {
        return 0x00a3d9
    } else if (rarity == "unique") {
        return 0xd13400
    } else if (rarity == "ultra") {
        return 0xfa00ab
    }
    console.error("unknown rarity", rarity)
    return 0x000000
}

export class Item {
    gridCellPos: IVector
    ws: WebSocket
    isInventoryItem: boolean

    pos: Vector
    raw: IItem

    container: Container
    sprite: Sprite
    tooltipContainer: Container



    constructor(rawItem: IItem, ws: WebSocket, isInventoryItem: boolean) {
        this.raw = rawItem
        this.isInventoryItem = isInventoryItem
        this.gridCellPos = rawItem.gridCellPos
        this.ws = ws
        this.pos = createVector(rawItem.pos.x, rawItem.pos.y)
        this.raw.uuid = rawItem.uuid

        this.sprite = new Sprite(getTextureFromResourceType(rawItem.itemSubType)) // shows only a blob
        this.sprite.interactive = true

        this.sprite.on("click", () => {
            if (isInventoryItem) {
                //activate / equip / use item in inventory -> send event to backend etc.
                ws.send(getPlayerClickedInventoryItemEvent(this.raw.uuid))
            } else {
                console.log("clicked item with rarity ", this.raw.rarity)
                ws.send(getPlayerClickedGroundItemEvent(this.raw.uuid, this.gridCellPos))
            }
        })

        this.sprite.on("mouseover", () => {
            this.tooltipContainer.visible = true
        })

        this.sprite.on("mouseout", () => {
            this.tooltipContainer.visible = false
        })

        this.container = new Container()


        const background1 = new Graphics()
        const borderSize = 4
        background1.beginFill(0xffffab);
        background1.drawRect(-borderSize, -borderSize, 35 + (borderSize * 2), 35 + (borderSize * 2));
        background1.endFill();
        this.container.addChild(background1)

        const background = new Graphics()
        background.beginFill(getRarityColorFromText(this.raw.rarity))
        background.drawRect(0, 0, 35, 35);
        background.endFill();
        this.container.addChild(background)


        this.container.addChild(this.sprite)

        this.container.position.set(this.pos.x, this.pos.y)
        this.addTooltip()
    }


    addTooltip() {
        this.tooltipContainer = new Container()
        this.tooltipContainer.visible = false
        let yPos = 2
        const background = new Graphics();
        if (this.raw.itemType === "weaponItem") {
            this.tooltipContainer.addChild(background)


            const step = 15

            const rarityText = new Text(String(`${this.raw.rarity}`), { fontFamily: 'Arial Black', fontSize: 12, fill: getRarityColorFromText(this.raw.rarity), align: 'center' })
            rarityText.position.set(2, yPos)
            yPos += step
            this.tooltipContainer.addChild(rarityText)

            const dmgText = new Text(String(`Dmg: ${this.raw.minDamage} to ${this.raw.maxDamage}`), { fontFamily: 'Arial Black', fontSize: 12, fill: 0xffffff, align: 'center' })
            dmgText.position.set(2, yPos)
            yPos += step
            this.tooltipContainer.addChild(dmgText)


            const atkSpeedText = new Text(String(`AtkSpeed: ${this.raw.attackSpeed}`), { fontFamily: 'Arial Black', fontSize: 12, fill: 0xffffff, align: 'center' })
            atkSpeedText.position.set(2, yPos)
            yPos += step
            this.tooltipContainer.addChild(atkSpeedText)

            yPos += step

            this.raw.boni.forEach(b => {
                const boniText = new Text(String(`- ${b.attribute}: ${b.value >= 0 ? '+' : '-'}${b.value}`), { fontFamily: 'Arial Black', fontSize: 12, fill: 0xffffff, align: 'center' })
                boniText.position.set(2, yPos)
                yPos += step
                this.tooltipContainer.addChild(boniText)
            })
        }

        background.beginFill(0xaaaaaa);
        background.drawRect(0, 0, 150, yPos);
        background.endFill();
        this.tooltipContainer.position.set(0, this.isInventoryItem ? -yPos : 40)
        this.container.addChild(this.tooltipContainer)
    }

}