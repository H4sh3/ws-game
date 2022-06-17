import { Sprite } from "@inlet/react-pixi"
import { useState, ReactElement } from "react"
import { getAsserTexture } from "../etc/const"
import { useMainStore } from "../stores/MainStore"
import { createVector, getHitResourceEvent, Resource } from "../types/events"

import React, { useCallback } from 'react';
import { Graphics } from '@inlet/react-pixi';
import { Graphics as PGraphics } from "pixi.js"
import Vector from "../types/vector"


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
    const { ws } = useMainStore()

    const onClick = () => {
        /* if (playerPos.dist(r.pos) < 75) {
            if (ws !== undefined) {
                ws.send(JSON.stringify(getHitResourceEvent("0", r.id)))
            }
        } */
    }

    const rX = r.pos.x + 250
    const rY = r.pos.y + 250

    return <>
        <Sprite
            anchor={0.5}
            scale={hovered ? 1.1 : 1}
            x={rX}
            y={rY}
            interactive={true}
            mouseover={() => setHovered(true)}
            mouseout={() => setHovered(false)}
            texture={getAsserTexture(r.resourceType)}
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

const resources: React.ReactElement[] = []
let cnt = 0
for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
        const r: Resource = {
            hitpoints: { current: 100, max: 100 },
            id: cnt,
            isSolid: false,
            pos: createVector(x * 100, y * 100),
            resourceType: "stone"
        }
        resources.push(<ResourceItem r={r} key={cnt} />)
        cnt++
    }
}

export function getResources(): ReactElement {
    //const { getResources, count } = useMainStore()

    return <>
        {
            resources.map((r, i) => {
                return r
            })
        }
    </>
}