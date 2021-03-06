import { CompositeTilemap } from "@pixi/tilemap";
import { Container } from "pixi.js";
import { CellDataEvent, GameConfig } from "../events/events";
import { isBetween, randInt } from "../etc/math";

class TilemapHandler {
    terrainTileMap: Map<string, CompositeTilemap>
    container: Container
    gameConfig: GameConfig

    constructor(gameConfig: GameConfig) {
        this.gameConfig = gameConfig
        this.terrainTileMap = new Map()
        this.container = new Container()
        this.container.interactive = true
    }

    setGameConfig(gameConfig: GameConfig) {
        this.gameConfig = gameConfig
    }

    processCellDataEvent(event: CellDataEvent) {
        const cellTilemap = new CompositeTilemap()

        event.subCells.forEach(sc => {

            const scPosX = event.pos.x * this.gameConfig.gridCellSize + (sc.pos.x * this.gameConfig.subCellSize)
            const scPosY = event.pos.y * this.gameConfig.gridCellSize + (sc.pos.y * this.gameConfig.subCellSize)


            if (sc.terrainType == "Grass") {
                const r = randInt(0, 100)
                if (r < 50) {
                    cellTilemap.tile("assets/grass1.png", scPosX, scPosY)
                }
                if (isBetween(r, 50, 75)) {
                    cellTilemap.tile("assets/grass2.png", scPosX, scPosY)
                }
                if (isBetween(r, 76, 100)) {
                    cellTilemap.tile("assets/grass3.png", scPosX, scPosY)
                }
            }

            if (sc.terrainType == "Water") {
                cellTilemap.tile("assets/water.png", scPosX, scPosY)
            }

            if (sc.terrainType == "ShallowWater") {
                cellTilemap.tile("assets/shallowWater.png", scPosX, scPosY)
            }

            if (sc.terrainType == "Sand") {
                const r = randInt(0, 100)
                if (r < 50) {
                    cellTilemap.tile("assets/sand1.png", scPosX, scPosY)
                }
                if (isBetween(r, 50, 75)) {
                    cellTilemap.tile("assets/sand2.png", scPosX, scPosY)
                }
                if (isBetween(r, 76, 100)) {
                    cellTilemap.tile("assets/sand3.png", scPosX, scPosY)
                }
            }

        })

        this.terrainTileMap.set(event.gridCellKey, cellTilemap)
        this.container.addChild(cellTilemap)
    }

    removeGridCellTiles(gridCellKey: string) {
        if (this.terrainTileMap.has(gridCellKey)) {

            // remove tiles from container
            const tile = this.terrainTileMap.get(gridCellKey)
            tile.destroy()
            tile.children.forEach(c => c.destroy())
            this.container.removeChild(tile)

            // remove entry from map
            this.terrainTileMap.delete(gridCellKey)
        }
    }
}

export default TilemapHandler