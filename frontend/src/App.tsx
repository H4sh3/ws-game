import { ReactElement, useEffect, useState } from 'react'
import { Stage, Sprite, Container, useTick } from '@inlet/react-pixi'
import { KeyStates, isNewPlayerEvent, isAssignUserIdEvent, isPlayerTargetPositionEvent, isResourcePositionsEvent, createVector, isPlayerDisconnectedEvent } from './types/events'
import { useMainStore } from './MainStore'
import { enableMapSet } from 'immer'
import { ASSETS, playerFrames, wsUrl } from './const'


import * as PIXI from "pixi.js";



function Player(): ReactElement {
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

function Resources(): ReactElement {
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

const OtherPlayers: React.FunctionComponent = () => {
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


function App(): ReactElement {
  enableMapSet()
  const [connected, setConnected] = useState(false)

  const { playerId, setPlayerId, getPlayerArr, spawnPlayer, setPlayerTargetPos, setResources, getPlayerPos, getOtherPlayers,
    addKeyEvent, setWs, ws, removePlayer
  } = useMainStore()

  useEffect(() => {
    if (ws === undefined) {

      const tmpWs = new WebSocket(wsUrl)

      tmpWs.onerror = (error) => {
        console.log(error)
      }

      tmpWs.onopen = () => {
        setConnected(true)
      }

      tmpWs.onmessage = (m) => {

        if (typeof (m.data) == "string") {

          m.data.split("\n").forEach(message => {
            let parsed: any = JSON.parse(message)

            if (isNewPlayerEvent(parsed)) {
              spawnPlayer(parsed.id, createVector(parsed.pos.x, parsed.pos.y))
            } else if (isAssignUserIdEvent(parsed)) { // join event
              const id: number = parsed.id
              setPlayerId(id)
              document.addEventListener('keydown', (e: KeyboardEvent) => {
                if (!e.repeat) {
                  addKeyEvent(e.key, KeyStates.DOWN)
                }
              });
              document.addEventListener('keyup', (e: KeyboardEvent) => {
                if (!e.repeat) {
                  addKeyEvent(e.key, KeyStates.UP)
                }
              });
            } else if (isPlayerTargetPositionEvent(parsed)) {
              setPlayerTargetPos(parsed.id, createVector(parsed.pos.x, parsed.pos.y))
            } else if (isResourcePositionsEvent(parsed)) {
              setResources(parsed.resources)
            } else if (isPlayerDisconnectedEvent(parsed)) {
              removePlayer(parsed.id)
            }
          })
        }
      }
      setWs(tmpWs)
    }

  }, [])

  if (!connected) {
    return <>loading...</>
  }

  return (
    <div className=" w-full h-full bg-gray-500 select-none">
      <div className="flex flex-row justify-center h-full">
        <div className="flex flex-col justify-center">
          <div className="flex flex-row items-center gap-2">
            Connection
            <div className={`${connected ? 'bg-green-500' : 'bg-red-500'} h-3 w-3 rounded-full`}>
            </div>
          </div>
          <div>
            {`UserId: ${playerId}`}
          </div>
          <div>
            {`Players: ${getPlayerArr().length}`}
          </div>
          <div>
            {`${getPlayerPos().x}`}
          </div>
          <div>
            {`${getPlayerPos().y}`}
          </div>
          <Stage width={500} height={500} options={{ backgroundColor: 0xeef1f5 }}>
            <Container position={[0, 0]}>
              <OtherPlayers />
              <Resources />
              <Player />
            </Container>
          </Stage>
        </div>
      </div>
    </div>
  )
}

export default App
