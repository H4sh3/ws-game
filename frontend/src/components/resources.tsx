import { Sprite } from "@inlet/react-pixi"
import { useState, ReactElement } from "react"
import { ASSETS } from "../etc/const"
import { useMainStore } from "../stores/MainStore"
import { getHitResourceEvent, Resource } from "../types/events"

interface ResourceProps {
    resource: Resource
}

const ResourceItem: React.FunctionComponent<ResourceProps> = ({ resource }) => {
    const [hovered, setHovered] = useState(false)
    const { getPlayerPos, ws } = useMainStore()

    const onClick = () => {
        if (getPlayerPos().dist(resource.pos) < 75) {
            if (ws !== undefined) {
                console.log(resource.id)
                ws.send(JSON.stringify(getHitResourceEvent("0", resource.id)))
            }
        }
    }

    return <Sprite
        anchor={0.5}
        scale={hovered ? 1.1 : 1}
        x={resource.pos.x + 250 - getPlayerPos().x}
        y={resource.pos.y + 250 - getPlayerPos().y}
        interactive={true}
        mouseover={() => setHovered(true)}
        mouseout={() => setHovered(false)}
        image={`/assets/${ASSETS.Iron}`}
        click={onClick}
    />
}

export function Resources(): ReactElement {
    const { getResources } = useMainStore()

    return <>
        {
            getResources().map((r, i) => {
                return <ResourceItem
                    key={i}
                    resource={r}
                />
            })
        }
    </>
}