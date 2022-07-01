import { Sound, sound } from '@pixi/sound'
import { ResourceTypes } from './resource';


export class SoundHandler {

    hit1: Sound
    hit2: Sound
    treeHit1: Sound
    constructor() {
        this.hit1 = sound.add('hit1', 'assets/sounds/hit1.wav');
        this.hit2 = sound.add('hit2', 'assets/sounds/hit2.wav');
        this.treeHit1 = sound.add('treeHit1', 'assets/sounds/treeHit1.wav');
        this.treeHit1.volume = 0.9
    }

    randomHitSound() {
    }

    hitResource(resourceType: string) {
        switch (resourceType) {
            case ResourceTypes.Stone:
                this.hit2.play()
                break
            case ResourceTypes.Blockade:
                this.hit1.play()
                break
            case ResourceTypes.Tree:
                this.treeHit1.play()
                break
        }
    }
}