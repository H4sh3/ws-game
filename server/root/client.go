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
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	id_cnt  = 0
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
	send chan []byte
	Id   int
	Pos  shared.Vector
	// Inventory []resource.Resource
	Inventory      map[resource.ResourceType]resource.Resource
	ZoneChangeTick int
	GridCell       *GridCell
	Connected      bool
}

func NewClient(hub *Hub, conn *websocket.Conn) *Client {
	clientPostion := shared.Vector{X: shared.RandIntInRange(-50, 50), Y: shared.RandIntInRange(-50, 50)}
	inventory := make(map[resource.ResourceType]resource.Resource)

	inventory[resource.Brick] = *resource.NewResource(resource.Brick, shared.Vector{}, hub.ResourceManager.GetResourceId(), 50, false, 100, false, "")

	sendChan := make(chan []byte, 256)

	gridCell := hub.GridManager.GetCellFromPos(clientPostion)
	client := &Client{hub: hub, conn: conn, send: sendChan, Id: id_cnt, Pos: clientPostion, Inventory: inventory, GridCell: gridCell, Connected: true}
	gridCell.Players[client.Id] = client

	// subscribe to current and all surrounding cells
	for _, cell := range hub.GridManager.getCells(gridCell.Pos.X, gridCell.Pos.Y) {
		cell.Subscribe(client)
	}

	return client
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()

		// empty message
		if len(message) == 0 {
			return
		}

		// all message recieved from client get unmarshalled to structs
		UnmarshalClientEvents(message, c.hub, c)

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		//message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
		//c.hub.broadcast <- message
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
		ticker.Stop()
		client.conn.Close()
	}()
	for {
		select {
		case message, ok := <-client.send:
			if !client.Connected {
				fmt.Println("Don't send events to disconnected client!")
				return
			}
			client.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				client.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := client.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(client.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-client.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			client.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := client.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
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
	client := NewClient(hub, conn) //&Client{hub: hub, conn: conn, send: make(chan []byte, 256), Id: id_cnt, Pos: clientPostion, Inventory: make(map[resource.ResourceType]resource.Resource)}
	client.send <- events.GetAssignUserIdEvent(id_cnt)

	// send message to all clients subscribed to the cell where the player spawned
	for _, subscription := range client.GridCell.PlayerSubscriptions {
		new_client_message := []byte(events.GetNewPlayerEvent(subscription.Player.Id, subscription.Player.Pos))

		if subscription.Player.Connected {
			subscription.Player.send <- new_client_message
		}
	}

	// provide the new player with all resources
	// client.send <- events.NewResourcePositionsEvent(hub.Resources)

	client.hub.register <- client
	hub.new_client(client)
	id_cnt += 1

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
	m.Unlock()
}

func UnmarshalClientEvents(jsonInput []byte, h *Hub, c *Client) {
	event_data := &events.BaseEvent{}
	if err := json.Unmarshal(jsonInput, &event_data); err != nil {
		fmt.Println("Error unmarshalling Event:")
		fmt.Println(jsonInput)
		return
	}

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
