import { Container, Text } from "pixi.js";
import { randInt } from "../etc/math";
import { createVector } from "../events/events";
import Vector from "../types/vector";

class TextItem {
    container: Container
    text: Text
    tick: number
    pos: Vector

    constructor(displayText: string, pos: Vector, color: string, crit: boolean) {
        let text: Text;
        let yOffset = 0
        if (crit) {
            text = new Text(displayText, { fontFamily: 'Arial Black', fontSize: 24, fill: color, align: 'center' });
            yOffset = -5
        } else {
            text = new Text(displayText, { fontFamily: 'Arial', fontSize: 16, fill: color, align: 'center' });
        }
        this.container = new Container()
        this.container.position.set(pos.x, pos.y + yOffset)
        this.container.addChild(text)
        this.tick = 0
        this.pos = pos
    }

    update() {
        this.container.position.y -= 0.5
        this.tick++
    }

    done() {
        return this.tick > 60
    }

}

class TextHandler {
    items: TextItem[]
    container: Container

    constructor() {
        this.items = []
        this.container = new Container()
    }


    addItem(displayText: string, pos: Vector, color: string, crit: boolean = false) {
        const validPos = pos.copy()
        let cTrie = 0
        const maxTrie = 50
        const step = 25
        while (this.items.some(i => i.pos.dist(validPos) < 15)) {
            if (cTrie >= maxTrie) break

            validPos.add(createVector(randInt(-step, step), randInt(-step, step)))
            cTrie++
        }

        const item = new TextItem(displayText, validPos, color, crit)
        this.container.addChild(item.container)
        this.items.push(item)
    }

    update() {
        this.items.forEach(i => {
            i.update()

            // if done remove from container
            if (i.done()) {
                this.container.removeChild(i.container)
            }
        })

        // remove finished texts from array
        this.items = this.items.filter(i => !i.done())
    }

}

export default TextHandler
