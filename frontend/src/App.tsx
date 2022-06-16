import { ReactElement, useEffect, useState } from 'react'
import { Stage, Container } from '@inlet/react-pixi'
import { KeyStates, isNewPlayerEvent, isAssignUserIdEvent, isPlayerTargetPositionEvent, isResourcePositionsEvent, createVector, isPlayerDisconnectedEvent, isUpdateResourceEvent } from './types/events'
import { useMainStore } from './stores/MainStore'
import { enableMapSet } from 'immer'
import { wsUrl } from './etc/const'
import { OtherPlayers, Player } from './components/players'
import { Resources } from './components/resources'


function App(): ReactElement {
  enableMapSet()
  const [connected, setConnected] = useState(false)

  const { playerId, setPlayerId, getPlayerArr, spawnPlayer, setPlayerTargetPos, setResources, getPlayerPos,
    addKeyEvent, setWs, ws, removePlayer, handleResourceHit
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
            } else if (isUpdateResourceEvent(parsed)) {
              handleResourceHit(parsed)
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
