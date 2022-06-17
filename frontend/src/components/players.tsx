import { Sprite, useTick } from "@inlet/react-pixi"
import { useMainStore } from "../stores/MainStore"
import { ReactElement } from "react";
import { PlayerTextures } from "../etc/const";

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
                    image={`/assets/${PlayerTextures[p.frame]}`}
                />
            })
        }
    </>
}

export function Player(): ReactElement {
    const { playerId, updatePlayerPositions, getPlayerFrame } = useMainStore()

    useTick(delta => {
        console.log(60 / delta)
        updatePlayerPositions(delta)
    })

    if (playerId == -1) {
        return <></>
    }

    return <Sprite
        anchor={0.5}
        x={250}
        y={250}
        texture={PlayerTextures[getPlayerFrame()]}
    />
}