import { AnimatedSprite } from "pixi.js";
import { SCREEN_SIZE } from "../etc/const";

const humanFrames: string[] = []
for (let i = 0; i <= 6; i++) {
    humanFrames.push(`assets/human/tile00${i}.png`)
}

export function getOtherPlayerSprite(): AnimatedSprite {
    const sprite = AnimatedSprite.fromFrames(humanFrames);
    sprite.animationSpeed = 0.3;
    sprite.anchor.set(0.5)
    //sprite.scale.set(2, 2)
    return sprite
}

export function getOwnPlayerSprite(): AnimatedSprite {
    const sprite = AnimatedSprite.fromFrames(humanFrames);
    sprite.animationSpeed = 0.3;
    sprite.x = (SCREEN_SIZE / 2)
    sprite.y = (SCREEN_SIZE / 2)
    sprite.anchor.set(0.5)
    //sprite.scale.set(2, 2)
    return sprite
}