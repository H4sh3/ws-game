import { Graphics } from "pixi.js";
import { SCREEN_SIZE } from "../etc/const";

export function getBackgroundGraphics(): Graphics {
    const background = new Graphics();
    background.beginFill(0x2BB130);
    background.drawRect(0, 0, SCREEN_SIZE, SCREEN_SIZE);
    background.endFill();
    return background
}

export function getInventoryBackground(): Graphics {
    const h = 60
    const inventoryBackground = new Graphics()
    inventoryBackground.beginFill(0xCCCCCC);
    inventoryBackground.lineStyle(2, 0x666666, 1);
    inventoryBackground.drawRect(0, SCREEN_SIZE - h, SCREEN_SIZE, h);
    inventoryBackground.endFill();
    return inventoryBackground
}