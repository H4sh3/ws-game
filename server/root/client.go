package root

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
	"ws-game/events"
	"ws-game/resource"
	"ws-game/shared"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 1024
)

var (
	newline = []byte{'\n'}
)

func x(r *http.Request) bool {
	// accept all connections for now
	// in prod only allow connections from proxy
	return true
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     x,
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub *Hub

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send     chan interface{} //[]byte
	Id       int
	Pos      shared.Vector
	PosMutex sync.Mutex
	// Inventory []resource.Resource
	Inventory           map[resource.ResourceType]resource.Resource
	ZoneChangeTick      int
	ZoneChangeTickMutex sync.Mutex
	GridCell            *GridCell
	GridCellMutex       sync.Mutex
	Connected           bool
	ConnectedMutex      sync.Mutex
}

func NewClient(hub *Hub, conn *websocket.Conn, id int) *Client {
	spawnRange := 4
	x := shared.RandIntInRange(-spawnRange, spawnRange) * 35
	y := shared.RandIntInRange(-spawnRange, spawnRange) * 35
	clientPostion := shared.Vector{X: x, Y: y}

	sendChan := make(chan interface{}, 1024)

	gridCell := hub.GridManager.GetCellFromPos(clientPostion)
	client := &Client{
		hub:                 hub,
		conn:                conn,
		send:                sendChan,
		Id:                  id,
		Pos:                 clientPostion,
		GridCell:            gridCell,
		Connected:           true,
		PosMutex:            sync.Mutex{},
		ZoneChangeTickMutex: sync.Mutex{},
		GridCellMutex:       sync.Mutex{},
	}

	gridCell.AddPlayer(client)

	for _, cell := range hub.GridManager.getCells(x/GridCellSize, y/GridCellSize) {
		cell.Subscribe <- client
	}

	return client
}

func (c *Client) getConnected() bool {
	c.ConnectedMutex.Lock()
	isConn := c.Connected
	c.ConnectedMutex.Unlock()
	return isConn
}

func (c *Client) setConnected(v bool) {
	c.ConnectedMutex.Lock()
	c.Connected = v
	c.ConnectedMutex.Unlock()
}

func (c *Client) getPos() shared.Vector {
	c.PosMutex.Lock()
	pos := c.Pos
	c.PosMutex.Unlock()
	return pos
}

func (c *Client) setPos(newPos shared.Vector) {
	c.PosMutex.Lock()
	c.Pos = newPos
	c.PosMutex.Unlock()
}

func (c *Client) getZoneTick() int {
	c.ZoneChangeTickMutex.Lock()
	tick := c.ZoneChangeTick
	c.ZoneChangeTickMutex.Unlock()
	return tick
}

func (c *Client) IncrementZoneTick() {
	c.ZoneChangeTickMutex.Lock()
	c.ZoneChangeTick += 1
	c.ZoneChangeTickMutex.Unlock()
}

func (c *Client) getGridCell() *GridCell {
	c.GridCellMutex.Lock()
	gC := c.GridCell
	c.GridCellMutex.Unlock()
	return gC
}

func (c *Client) setGridCell(cell *GridCell) {
	c.GridCellMutex.Lock()
	c.GridCell = cell
	c.GridCellMutex.Unlock()
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {

	// defer func gets called after for loop breaks -> closes connection
	defer func() {
		fmt.Println("unregsiter from read")
		c.hub.unregister <- c
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		event := &events.BaseEvent{}
		if c.getConnected() {
			err := c.conn.ReadJSON(event)
			if err != nil {
				fmt.Println(err)
				return
			}

			UnmarshalClientEvents(*event, c.hub, c)

			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("error: %v", err)
				}
				break
			}
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (client *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		fmt.Println("unregsiter from write")
		ticker.Stop()
		client.hub.unregister <- client
	}()

	for {
		select {
		case message, ok := <-client.send:
			if !client.getConnected() || !ok {
				return
			}
			// json
			client.conn.SetWriteDeadline(time.Now().Add(writeWait))
			client.conn.WriteJSON(message)
		case <-ticker.C:
			client.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := client.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				fmt.Println("write message deadline kill!!!")
				return
			}
		}
	}
}

// serveWs handles websocket requests from the peer.
func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request, m *sync.Mutex) {
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println(err)
		return
	}

	m.Lock()
	client := NewClient(hub, conn, hub.getClientId()) //&Client{hub: hub, conn: conn, send: make(chan []byte, 256), Id: id_cnt, Pos: clientPostion, Inventory: make(map[resource.ResourceType]resource.Resource)}

	// send message to all clients subscribed to the cell where the player spawned
	/*
		for _, subscription := range client.GridCell.PlayerSubscriptions {
			new_client_message := []byte(events.GetNewPlayerEvent(subscription.Player.Id, subscription.Player.Pos))

			if subscription.Player.Connected {
					subscription.Player.send <- new_client_message
				}
			}
	*/

	// provide the new player with all resources
	// client.send <- events.NewResourcePositionsEvent(hub.Resources)

	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
	m.Unlock()
	client.send <- events.GetAssignUserIdEvent(client.Id, client.Pos)
	client.send <- events.NewPlayerTargetPositionEvent(client.Pos, client.Id)

	inventory := make(map[resource.ResourceType]resource.Resource)
	inventory[resource.Brick] = *resource.NewResource(resource.Brick, shared.Vector{}, hub.ResourceManager.GetResourceId(), 50, false, 100, false, "")
	client.Inventory = inventory
	client.send <- events.NewLoadInventoryEvent(client.Inventory)
}

func UnmarshalClientEvents(event_data events.BaseEvent, h *Hub, c *Client) {
	//	event_data := &events.BaseEvent{}
	//	if err := json.Unmarshal(jsonInput, &event_data); err != nil {
	//		fmt.Println("Error unmarshalling Event:")
	//		fmt.Println(jsonInput)
	//		return
	//	}

	switch event_data.EventType {
	case events.KEYBOARD_EVENT:
		keyboardEvent := &events.KeyBoardEvent{}
		if err := json.Unmarshal(event_data.Payload, &keyboardEvent); err != nil {
			panic(err)
		}

		h.handleMovementEvent(*keyboardEvent, c)

	case events.HIT_RESOURCE_EVENT:
		event := &events.HitResourceEvent{}
		if err := json.Unmarshal(event_data.Payload, &event); err != nil {
			panic(err)
		}
		h.HandleResourceHit(*event, c)

	case events.LOOT_RESOURCE_EVENT:
		event := &events.LootResourceEvent{}
		if err := json.Unmarshal(event_data.Payload, &event); err != nil {
			panic(err)
		}
		h.HandleLootResource(*event, c)

	case events.PLAYER_PLACED_RESOURCE_EVENT:
		event := &events.PlayerPlacedResourceEvent{}

		if err := json.Unmarshal(event_data.Payload, &event); err != nil {
			panic(err)
		}

		h.HandlePlayerPlacedResource(*event, c)

	}

}
