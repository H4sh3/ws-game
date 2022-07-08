import { CompositeTilemap } from "@pixi/tilemap";
import { Container } from "pixi.js";
import { CellDataEvent } from "../events/events";
import { GRID_CELL_SIZE, SUB_CELL_SIZE } from "./const";
import { isBetween, randInt } from "./math";

class TilemapHandler {
    terrainTileMap: Map<string, CompositeTilemap>
    tilemapContainer: Container
    constructor(tilemapContainer: Container) {
        this.terrainTileMap = new Map()
        this.tilemapContainer = tilemapContainer
    }

    processCellDataEvent(event: CellDataEvent, worldContainer: Container) {
        const cellTilemap = new CompositeTilemap()

        event.subCells.forEach(sc => {

            const scPosX = event.pos.x * GRID_CELL_SIZE + (sc.pos.x * SUB_CELL_SIZE)
            const scPosY = event.pos.y * GRID_CELL_SIZE + (sc.pos.y * SUB_CELL_SIZE)


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

        this.tilemapContainer.addChild(cellTilemap)
        //worldContainer.addChild(cellTilemap)
    }

    handleRemove(gridCellKey: string, worldContainer: Container) {
        if (this.terrainTileMap.has(gridCellKey)) {
            this.terrainTileMap.delete(gridCellKey)

            // worldContainer.removeChild(this.terrainTileMap.get(gridCellKey))
            this.tilemapContainer.removeChild(this.terrainTileMap.get(gridCellKey))
        }
    }
}

export default TilemapHandler