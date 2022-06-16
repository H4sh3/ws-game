import { Sprite } from "@inlet/react-pixi"
import { useState, ReactElement } from "react"
import { ASSETS } from "../etc/const"
import { useMainStore } from "../stores/MainStore"

interface ResourceProps {
    x: number
    y: number
}

const Resource: React.FunctionComponent<ResourceProps> = ({ x, y }) => {
    const [hovered, setHovered] = useState(false)
    return <Sprite
        anchor={0.5}
        scale={hovered ? 1.1 : 1}
        x={x}
        y={y}
        interactive={true}
        mouseover={() => setHovered(true)}
        mouseout={() => setHovered(false)}
        image={`/assets/${ASSETS.Iron}`}
    />
}

export function Resources(): ReactElement {
    const { getResources, getPlayerPos } = useMainStore()

    return <>
        {
            getResources().map((r, i) => {
                return <Resource
                    key={i}
                    x={r.pos.x + 250 - getPlayerPos().x}
                    y={r.pos.y + 250 - getPlayerPos().y}
                />
            })
        }
    </>
}