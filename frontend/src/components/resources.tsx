import { Sprite } from "@inlet/react-pixi"
import { useState, ReactElement } from "react"
import { ASSETS } from "../etc/const"
import { useMainStore } from "../stores/MainStore"
import { getHitResourceEvent, Resource } from "../types/events"

import React, { useCallback } from 'react';
import { Graphics } from '@inlet/react-pixi';


interface RectProps {
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
}
const Rectangle: React.FC<RectProps> = ({ x, y, w, h, color }) => {
    const draw = useCallback((g) => {
        g.clear();
        g.beginFill(color);
        g.drawRect(x, y, w, h);
        g.endFill();
    }, [x, y, w, h, color]);

    return <Graphics draw={draw} />;
}

interface ResourceProps {
    resource: Resource
}

const ResourceItem: React.FunctionComponent<ResourceProps> = ({ resource }) => {
    const [hovered, setHovered] = useState(false)
    const { getPlayerPos, ws } = useMainStore()

    const onClick = () => {
        if (getPlayerPos().dist(resource.pos) < 75) {
            if (ws !== undefined) {
                ws.send(JSON.stringify(getHitResourceEvent("0", resource.id)))
            }
        }
    }

    const rX = resource.pos.x + 250 - getPlayerPos().x
    const rY = resource.pos.y + 250 - getPlayerPos().y

    return <>
        {
            resource.hitpoints.current !== resource.hitpoints.max ?
                <>
                    <Rectangle x={rX - 30} y={rY - 40} w={60} h={10} color={"0x000000"} />
                    <Rectangle x={rX - 30} y={rY - 40} w={60 * (resource.hitpoints.current / resource.hitpoints.max)} h={10} color={"0x00FF00"} />
                </>
                : <></>
        }
        <Sprite
            anchor={0.5}
            scale={hovered ? 1.1 : 1}
            x={rX}
            y={rY}
            interactive={true}
            mouseover={() => setHovered(true)}
            mouseout={() => setHovered(false)}
            image={`/assets/${ASSETS.Iron}`}
            click={onClick}
        />
    </>
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