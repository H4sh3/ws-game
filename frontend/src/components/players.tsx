import { Sprite, useTick } from "@inlet/react-pixi"
import { playerFrames } from "../etc/const"
import { useMainStore } from "../stores/MainStore"
import * as PIXI from "pixi.js";
import { ReactElement } from "react";

export const OtherPlayers: React.FunctionComponent = () => {
    const { getOtherPlayers, getPlayerPos } = useMainStore()

    return <>
        {
            getOtherPlayers().map((p, i) => {
                return <Sprite
                    key={i}
                    anchor={0.5}
                    x={p.currentPos.x + 250 - getPlayerPos().x}
                    y={p.currentPos.y + 250 - getPlayerPos().y}
                    image={`/assets/${playerFrames[p.frame]}`}
                />
            })
        }
    </>
}

export function Player(): ReactElement {
    const { playerId, updatePlayerPositions, getPlayerFrame } = useMainStore()

    useTick(delta => {
        updatePlayerPositions(delta)
    })

    if (playerId == -1) {
        return <></>
    }

    const textures = [
        PIXI.Texture.from(`/assets/${playerFrames[0]}`),
        PIXI.Texture.from(`/assets/${playerFrames[1]}`),
        PIXI.Texture.from(`/assets/${playerFrames[2]}`),
        PIXI.Texture.from(`/assets/${playerFrames[3]}`)
    ]

    return <Sprite
        anchor={0.5}
        x={250}
        y={250}
        texture={textures[getPlayerFrame()]}
    />
}