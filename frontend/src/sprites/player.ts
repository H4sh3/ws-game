import { AnimatedSprite } from "pixi.js";
import { SCREEN_SIZE } from "../etc/const";


export const getHumanTiles = (): string[] => {
    const paths = []
    for (let i = 0; i <= 6; i++) {
        paths.push(`assets/human/tile00${i}.png`)
    }
    return paths
}


const humanTiles: string[] = getHumanTiles()

export const PLAYER_SPRITE_SCALE = 2

export function getOtherPlayerSprite(): AnimatedSprite {
    const sprite = AnimatedSprite.fromFrames(humanTiles);
    sprite.animationSpeed = 0.3;
    sprite.anchor.set(0.5)
    sprite.scale.set(PLAYER_SPRITE_SCALE, PLAYER_SPRITE_SCALE)
    return sprite
}

export function getOwnPlayerSprite(): AnimatedSprite {
    const sprite = AnimatedSprite.fromFrames(humanTiles);
    sprite.animationSpeed = 0.3;
    sprite.x = (SCREEN_SIZE / 2)
    sprite.y = (SCREEN_SIZE / 2)
    sprite.anchor.set(0.5)
    sprite.scale.set(PLAYER_SPRITE_SCALE, PLAYER_SPRITE_SCALE)
    return sprite
}