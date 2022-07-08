import { Container, Text } from "pixi.js";
import Vector from "../types/vector";

class TextItem {
    container: Container
    text: Text
    tick: number

    constructor(displayText: string, pos: Vector, color: string) {
        let text = new Text(displayText, { fontFamily: 'Arial', fontSize: 16, fill: color, align: 'center' });
        this.container = new Container()
        this.container.position.set(pos.x, pos.y)
        this.container.addChild(text)
        this.tick = 0
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
    textItemContainer: Container

    constructor() {
        this.items = []
        this.textItemContainer = new Container()
    }


    addItem(displayText: string, pos: Vector, color: string) {
        const item = new TextItem(displayText, pos, color)
        this.textItemContainer.addChild(item.container)
        this.items.push(item)
    }

    update() {
        this.items.forEach(i => {
            i.update()

            // if done remove from container
            if (i.done()) {
                this.textItemContainer.removeChild(i.container)
            }
        })

        // remove finished texts from array
        this.items = this.items.filter(i => !i.done())
    }

}

export default TextHandler