import { BaseTexture, Container, Sprite, Spritesheet, Texture } from "pixi.js";
import { createVector, ResourcePositionsEvent, UpdateResourceEvent } from "../events/events";
import { Game } from "../main";
import { Resource } from "../types/resource";


interface ItemTextures {
    brick?: Texture
    log?: Texture
    ironOre?: Texture
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
        }
    }

    const frameNames = [
        "brick",
        "log",
        "ironOre"
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
        itemTextures.brick = spritesheet.animations.frameNames[0]
        itemTextures.log = spritesheet.animations.frameNames[1]
        itemTextures.ironOre = spritesheet.animations.frameNames[2]
    });

    return itemTextures
}

class ResourceHandler {
    // resources located in a gridcell
    resourceMap: Map<string, Resource[]>
    resourceArr: Resource[]
    container: Container


    constructor() {
        this.resourceMap = new Map()
        this.resourceArr = []
        this.container = new Container()
    }

    handleAddResourceEvent(parsed: ResourcePositionsEvent, game: Game) {
        parsed.resources.forEach(r => {
            const pos = createVector(r.pos.x, r.pos.y)
            const resource: Resource = new Resource(r.id, game.player, r.quantity, r.resourceType, pos, r.hitpoints, r.isSolid, game.app.loader, game.ws, r.isLootable)

            game.worldContainer.addChild(resource.container);


            const { gridCellKey } = r;
            if (this.resourceMap.has(gridCellKey)) {
                const resources = this.resourceMap.get(gridCellKey)
                resources.push(resource)
                this.resourceMap.set(gridCellKey, resources)
            } else {
                // init new array if its a new cell
                this.resourceMap.set(gridCellKey, [resource])
            }
        })
        this.updateResourceArr()
    }

    removeGridCellResources(gridCellKey: string, game: Game) {
        if (this.resourceMap.has(gridCellKey)) {
            this.resourceMap.get(gridCellKey).map(r => {
                game.worldContainer.removeChild(r.container)
            })
        }
        this.resourceMap.delete(gridCellKey)

        this.updateResourceArr()
    }

    updateResourceArr() {
        let allResources: Resource[] = []
        for (let k of this.resourceMap.keys()) {
            allResources = [...allResources, ...this.resourceMap.get(k)]
        }
        this.resourceArr = allResources
    }

    resources(): Resource[] {
        return this.resourceArr
    }

    handleUpdateResourceEvent(parsed: UpdateResourceEvent, game: Game) {
        let resources = this.resourceMap.get(parsed.gridCellKey)

        const r = resources.find(r => r.id == parsed.id)
        if (r) {
            if (parsed.remove) {
                resources = resources.filter(rO => rO.id !== parsed.id)
            }

            if (r.hitPoints.current !== parsed.hitpoints.current) {
                game.soundHandler.playerHitResource(r.resourceType)
            }

            if (parsed.damage > 0) {
                game.textHandler.addItem(`${parsed.damage}`, r.pos, "0xff0000")
            }

            r.hitPoints.current = parsed.hitpoints.current
            r.hitPoints.max = parsed.hitpoints.max
            r.updateHealthbar(r.container)

            if (r.hitPoints.current <= 0) {
                r.container.removeChild(r.sprite)
                this.container.removeChild(r.container)
            }

            this.resourceMap.set(parsed.gridCellKey, resources)
        } else {
            console.log("resourcen not found", parsed.gridCellKey)
            console.log(parsed.id)
        }
        this.updateResourceArr()
    }
}

export default ResourceHandler