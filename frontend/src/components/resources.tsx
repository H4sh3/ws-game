import { Sprite } from "@inlet/react-pixi"
import { useState, ReactElement } from "react"
import { ASSETS } from "../etc/const"
import { useMainStore } from "../stores/MainStore"
import { getHitResourceEvent, Resource } from "../types/events"

import React, { useCallback } from 'react';
import { Graphics } from '@inlet/react-pixi';
import { Graphics as PGraphics } from "pixi.js"


interface RectProps {
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
}
export const Rectangle: React.FC<RectProps> = ({ x, y, w, h, color }) => {
    const draw = useCallback((g: PGraphics) => {
        g.clear();
        g.beginFill(color);
        g.drawRect(x, y, w, h);
        g.endFill();
    }, [x, y, w, h, color]);

    return <Graphics draw={draw} />;
}

interface ResourceProps {
    r: Resource
}

const ResourceItem: React.FunctionComponent<ResourceProps> = ({ r }) => {
    const [hovered, setHovered] = useState(false)
    const { getPlayerPos, ws } = useMainStore()

    const onClick = () => {
        if (getPlayerPos().dist(r.pos) < 75) {
            if (ws !== undefined) {
                ws.send(JSON.stringify(getHitResourceEvent("0", r.id)))
            }
        }
    }

    const rX = r.pos.x + 250 - getPlayerPos().x
    const rY = r.pos.y + 250 - getPlayerPos().y

    return <>

        <Sprite
            anchor={0.5}
            scale={hovered ? 1.1 : 1}
            x={rX}
            y={rY}
            interactive={true}
            mouseover={() => setHovered(true)}
            mouseout={() => setHovered(false)}
            image={`/assets/${r.resourceType}.png`}
            click={onClick}
        />
    </>
}

export function Healthbars(): ReactElement {
    const { getResources, getPlayerPos } = useMainStore()
    return <>
        {
            getResources().map((r, i) => {
                const rX = r.pos.x + 250 - getPlayerPos().x
                const rY = r.pos.y + 250 - getPlayerPos().y
                return <>{
                    r.hitpoints.current !== r.hitpoints.max ?
                        <>
                            <Rectangle x={rX - 30} y={rY - 40} w={60} h={10} color={0x000000} />
                            <Rectangle x={rX - 29} y={rY - 39} w={58 * (r.hitpoints.current / r.hitpoints.max)} h={8} color={0x00FF00} />
                        </>
                        : <></>
                }</>
            })
        }
    </>
}

export function Resources(): ReactElement {
    const { getResources } = useMainStore()

    return <>
        {
            getResources().map((r, i) => {
                return <ResourceItem
                    key={i}
                    r={r}
                />
            })
        }
    </>
}