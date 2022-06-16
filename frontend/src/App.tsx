import { ReactElement, useEffect, useState } from 'react'
import { Stage, Sprite, Container, useTick } from '@inlet/react-pixi'
import { KeyStates, isNewPlayerEvent, isAssignUserIdEvent, isPlayerTargetPositionEvent, isResourcePositionsEvent, createVector, isPlayerDisconnectedEvent } from './types/events'
import { useMainStore } from './MainStore'
import { enableMapSet } from 'immer'


function Player(): ReactElement {
  const { playerId, updatePlayerPositions } = useMainStore()

  useTick(delta => {
    updatePlayerPositions(delta)
  })

  if (playerId == -1) {
    return <></>
  }

  return <Sprite
    anchor={0}
    x={125}
    y={125}
    image="/assets/rabbitsq.png"
  />
}


function App(): ReactElement {
  enableMapSet()
  const [connection, setConnection] = useState(false)

  const { playerId, setPlayerId, getPlayerArr, spawnPlayer, setPlayerTargetPos, setResources, getResources, getPlayerPos, fps, getOtherPlayers,
    addKeyEvent, setWs, ws, removePlayer
  } = useMainStore()

  useEffect(() => {
    if (ws === undefined) {
      const local = "ws://127.0.0.1:7777"
      const prod = "wss://game.gymcadia.com/websocket"
      let tmpWs = new WebSocket(local)

      tmpWs.onerror = (error) => {
        console.log(error)
      }

      tmpWs.onopen = () => {
        setConnection(true)
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
                  console.log("down!")
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

  return (
    <div className=" w-full h-full bg-gray-500">
      <div className="flex flex-row justify-center h-full">
        <div className="flex flex-col justify-center">
          <div>
            {`Websocket: ${connection ? 'connected' : 'disconnected'}`}
          </div>
          <div>
            {`UserId: ${playerId}`}
          </div>
          <div>
            {`Players: ${getPlayerArr().length}`}
          </div>
          <div>
            {fps}
          </div>
          <div>
            {`${getPlayerPos().x}`}
          </div>
          <div>
            {`${getPlayerPos().y}`}
          </div>
          <Stage width={500} height={500} options={{ backgroundColor: 0xeef1f5 }}>
            <Container position={[0, 0]}>
              {
                getOtherPlayers().map((p, i) => {
                  return <Sprite
                    key={i}
                    anchor={0}
                    x={p.currentPos.x + 125 - getPlayerPos().x}
                    y={p.currentPos.y + 125 - getPlayerPos().y}
                    image="/assets/rabbitsq.png"
                  />
                })
              }
              {
                getResources().map((r, i) => {
                  return <Sprite
                    key={i}
                    anchor={0}
                    x={r.pos.x + 125 - getPlayerPos().x}
                    y={r.pos.y + 125 - getPlayerPos().y}
                    image="/assets/iron2.png"
                  />
                })
              }
              <Player />
            </Container>
          </Stage>
        </div>
      </div>
    </div>
  )
}

export default App
