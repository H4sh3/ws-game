import { ReactElement, useEffect, useRef, useState } from 'react'
import { Stage, Sprite, Container } from '@inlet/react-pixi'
import { KeyStates, getKeyChangeEvent, Player, isNewPlayerEvent, createVector, isAssignUserIdEvent, isUpdatePlayerVelocityEvent } from './types'
import { isUndefined } from 'util'
import { usePlayers } from './PlayerStore'
import { enableMapSet } from 'immer'


const VALID_KEYS = ["w", "a", "s", "d"]

class KeyboardInputHandler {
  ws: WebSocket
  keys: Map<String, KeyStates>

  constructor(ws: WebSocket) {
    this.ws = ws
    this.keys = new Map()
    VALID_KEYS.forEach(k => {
      this.keys.set(k, KeyStates.UP)
    })
  }

  keyChange(key: string, value: KeyStates, userId: number) {
    if (this.keys.has(key)) {
      if (this.keys.get(key) !== value || true) {
        // change in key state
        // send to server
        this.keys.set(key, value)
        this.ws.send(JSON.stringify(getKeyChangeEvent(key, value, userId)))
      }
    }
  }
}

function getPlayer(players: Player[], playerId: number) {
  return players.find(p => p.id === playerId)
}

function App(): ReactElement {
  enableMapSet()
  const [connection, setConnection] = useState(false)
  const [myId, setMyId] = useState(-1)

  const { getPlayerArr, spawnPlayer, updatePlayer } = usePlayers()
  //const [ws, setWs] = useState<WebSocket>()

  let ws = useRef<WebSocket>()

  useEffect(() => {
    if (!ws.current) {
      ws.current = new WebSocket("ws://127.0.0.1:7777/ws")
      const keyboardInputHandler = new KeyboardInputHandler(ws.current)

      ws.current.onerror = (error) => {
        console.log(error)
      }

      ws.current.onopen = () => {
        setConnection(true)
      }

      ws.current.onmessage = (m) => {

        if (typeof (m.data) == "string") {

          m.data.split("\n").forEach(message => {
            let parsed: any = JSON.parse(message)

            if (isNewPlayerEvent(parsed)) {
              spawnPlayer(parsed.id, parsed.pos)
            } else if (isAssignUserIdEvent(parsed)) { // join event
              const id: number = parsed.id
              setMyId(id)

              document.addEventListener('keydown', logKeyDown);

              document.addEventListener('keyup', logKeyUp);

              function logKeyDown(e: KeyboardEvent) {
                keyboardInputHandler.keyChange(e.key, KeyStates.DOWN, id)
              }

              function logKeyUp(e: KeyboardEvent) {
                keyboardInputHandler.keyChange(e.key, KeyStates.UP, id)
              }
            } else if (isUpdatePlayerVelocityEvent(parsed)) {
              updatePlayer(parsed.id, parsed.velocity)
            }
          })
        }
      }

    }

  }, [])

  return (
    <div className="flex flex-col justify-center">
      <div>
        {`Websocket: ${connection ? 'connected' : 'disconnected'}`}
      </div>
      <div>
        {`UserId: ${myId}`}
      </div>
      <div>
        {`Players: ${getPlayerArr().length}`}
      </div>
      <Stage width={300} height={300} options={{ backgroundColor: 0xeef1f5 }}>
        <Container position={[150, 150]}>
          {
            getPlayerArr().map((p, i) => {
              return <Sprite
                key={i}
                anchor={0.5}
                x={p.pos.x}
                y={p.pos.y}
                image="https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/IaUrttj.png"
              />
            })
          }
        </Container>
      </Stage>
    </div>
  )
}

export default App
