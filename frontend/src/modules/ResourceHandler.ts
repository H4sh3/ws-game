import { BaseTexture, Container, Spritesheet, Texture } from "pixi.js";
import { createVector, ResourcePositionsEvent, UpdateResourceEvent } from "../events/events";
import { Game } from "../main";
import { Resource } from "../types/resource";


interface ItemTextures {
    placeholder?: Texture
    brick?: Texture
    log?: Texture
    ironOre?: Texture
    builderIcon?: Texture
    button?: Texture
    blockade?: Texture
    woodBlockade?: Texture
    stone?: Texture
    sword?: Texture
}

export function getItemTexture(path: string): ItemTextures {
    const atlas = {
        frames: {
        },
        meta: {
            image: path,
            format: 'RGBA8888',
            size: { w: 512, h: 867 },
            scale: "1"
        },
        animations: {
            frameNames: [] as string[]
        }
    }

    //  x:1 y:18
    const frames: { [id: string]: any } = {
        "placeholder": {
            frame: { x: 0 * 32, y: 24 * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        "brick": {
            frame: { x: 1 * 32, y: 17 * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        "log": {
            frame: { x: 0 * 32, y: 17 * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        "ironOre": {
            frame: { x: 0 * 32, y: 22 * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        "builderIcon": {
            frame: { x: 5 * 32, y: 4 * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        "button": {
            frame: { x: 1 * 32, y: 23 * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        "blockade": {
            frame: { x: 1 * 32, y: 22 * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        "woodBlockade": {
            frame: { x: 2 * 32, y: 22 * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        "stone": {
            frame: { x: 3 * 32, y: 22 * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        "sword": {
            frame: { x: 2 * 32, y: 5 * 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
    }

    const frameNames = [
        "placeholder",
        "brick",
        "log",
        "ironOre",
        "builderIcon",
        "button",
        "blockade",
        "woodBlockade",
        "stone",
        "sword"
    ]

    atlas.frames = frames
    atlas.animations.frameNames = frameNames


    // Create the SpriteSheet from data and image
    const spritesheet = new Spritesheet(
        BaseTexture.from(atlas.meta.image),
        atlas
    );

    // Generate all the Textures asynchronously
    const itemTextures: ItemTextures = {};

    spritesheet.parse(() => {
        itemTextures.placeholder = spritesheet.animations.frameNames[0]
        itemTextures.brick = spritesheet.animations.frameNames[1]
        itemTextures.log = spritesheet.animations.frameNames[2]
        itemTextures.ironOre = spritesheet.animations.frameNames[3]
        itemTextures.builderIcon = spritesheet.animations.frameNames[4]
        itemTextures.button = spritesheet.animations.frameNames[5]
        itemTextures.blockade = spritesheet.animations.frameNames[6]
        itemTextures.woodBlockade = spritesheet.animations.frameNames[7]
        itemTextures.stone = spritesheet.animations.frameNames[8]
        itemTextures.sword = spritesheet.animations.frameNames[9]
    });

    return itemTextures
}

export const itemTextures = getItemTexture("assets/items/item_collection.png")

export const getTextureFromResourceType = (resourceType: string): Texture => {
    // Todo: make this more generic
    if (resourceType == "blockade") {
        return itemTextures.blockade
    } else if (resourceType == "brick") {
        return itemTextures.brick

    } else if (resourceType == "log") {
        return itemTextures.log

    } else if (resourceType == "ironOre") {
        return itemTextures.ironOre

    } else if (resourceType == "builderIcon") {
        return itemTextures.builderIcon

    } else if (resourceType == "button") {
        return itemTextures.button
    } else if (resourceType == "woodBlockade") {
        return itemTextures.woodBlockade
    } else if (resourceType == "stone") {
        return itemTextures.stone
    } else if (resourceType == "sword") {
        return itemTextures.sword
    }
    console.error(`no sprite for ${resourceType}`)
    return itemTextures.placeholder
}



class ResourceHandler {
    resources: Resource[]
    container: Container


    constructor() {
        this.resources = []
        this.container = new Container()
    }

    handleAddResourceEvent(parsed: ResourcePositionsEvent, game: Game) {
        parsed.resources.forEach(r => {
            const pos = createVector(r.pos.x, r.pos.y)
            const resource: Resource = new Resource(r.gridCellKey, r.id, r.quantity, r.resourceType, pos, r.hitpoints, r.isSolid, r.isLootable, game)
            this.resources.push(resource)
            this.container.addChild(resource.container)
        })
    }

    removeGridCellResources(gridCellKey: string) {
        this.resources.filter(r => r.gridCellKey === gridCellKey).forEach(r => {
            r.container.children.forEach(c => c.destroy())
            r.container.destroy()
            this.container.removeChild(r.container)
        })

        this.resources.filter(r => r.gridCellKey !== gridCellKey)
    }


    handleUpdateResourceEvent(parsed: UpdateResourceEvent): Resource | undefined {

        const r = this.resources.find(r => r.id == parsed.id)
        if (r) {
            if (parsed.remove) {
                r.container.children.forEach(c => c.destroy())
                r.container.destroy()
                this.container.removeChild(r.container)
                this.resources = this.resources.filter(rO => rO.id !== parsed.id)
            }

            r.hitPoints.current = parsed.hitpoints.current
            r.hitPoints.max = parsed.hitpoints.max

            if (r.hitPoints.current <= 0) {
                r.container.children.forEach(c => c.destroy())
                r.container.destroy()
                this.container.removeChild(r.container)
                this.resources = this.resources.filter(rO => rO.id !== parsed.id)
            } else {
                r.updateHealthbar(r.container)
            }

            return r
        } else {
            console.log("resourcen not found", parsed.gridCellKey)
            console.log(parsed.id)
            return undefined
        }
    }
}

export default ResourceHandler