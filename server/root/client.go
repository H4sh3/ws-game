package root

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
	"ws-game/item"
	"ws-game/resource"
	"ws-game/shared"

	"github.com/google/uuid"
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
	send                chan interface{}
	Id                  int
	UUID                string
	Pos                 shared.Vector
	Hitpoints           shared.Hitpoints
	PosMutex            sync.Mutex
	ResourceInventory   map[resource.ResourceType]resource.Resource
	ItemInventory       []item.Item
	ItemInventoryMutex  sync.Mutex
	ZoneChangeTick      int
	ZoneChangeTickMutex sync.Mutex
	GridCell            *GridCell
	GridCellMutex       sync.Mutex
	Connected           bool
	ConnectedMutex      sync.Mutex
	NeedsInit           bool
	EquippedItemsMutex  sync.Mutex
	EquippedItems       []string
	minDamage           int
	maxDamage           int
}

func NewClient(hub *Hub, conn *websocket.Conn, id int) *Client {
	clientPostion := shared.Vector{X: GridCellSize / 2, Y: GridCellSize / 2}

	sendChan := make(chan interface{}, 1024)

	hitpoints := shared.Hitpoints{
		Current: 500,
		Max:     500,
	}

	gridCell := hub.GridManager.GetCellFromPos(clientPostion)
	client := &Client{
		hub:                 hub,
		conn:                conn,
		send:                sendChan,
		Id:                  id,
		UUID:                uuid.New().String(),
		Pos:                 clientPostion,
		GridCell:            gridCell,
		Connected:           true,
		PosMutex:            sync.Mutex{},
		ZoneChangeTickMutex: sync.Mutex{},
		GridCellMutex:       sync.Mutex{},
		NeedsInit:           true,
		Hitpoints:           hitpoints,
		ItemInventory:       []item.Item{},
		ItemInventoryMutex:  sync.Mutex{},
		EquippedItemsMutex:  sync.Mutex{},
		EquippedItems:       []string{},
		minDamage:           10,
		maxDamage:           20,
		// NeedsInit gets set to false after first cell data is provided to the client
	}

	return client
}

func (c *Client) handleInventoryItemClick(uuid string) {
	c.EquippedItemsMutex.Lock()
	defer c.EquippedItemsMutex.Unlock()

	deselect := false
	for i, itemUUID := range c.EquippedItems {
		if itemUUID == uuid {
			// deselect
			c.EquippedItems = append(c.EquippedItems[:i], c.EquippedItems[i+1:]...)
			deselect = true
		}
	}

	if !deselect {
		c.EquippedItems = append(c.EquippedItems, uuid)
	}
}

func (c *Client) updateStats() {
	strength := 0
	vitality := 0

	minDamage := 10
	maxDamage := 20

	c.EquippedItemsMutex.Lock()
	c.ItemInventoryMutex.Lock()
	defer func() {
		c.EquippedItemsMutex.Unlock()
		c.ItemInventoryMutex.Unlock()
	}()

	for _, inventoryItem := range c.ItemInventory {
		for _, itemUUID := range c.EquippedItems {
			if inventoryItem.UUID == itemUUID {
				// equipped item

				fmt.Println("equipped item")

				if inventoryItem.MinDamage > 0 {
					minDamage += inventoryItem.MinDamage
				}

				if inventoryItem.MaxDamage > 0 {
					maxDamage += inventoryItem.MaxDamage
				}

				for _, boni := range inventoryItem.Boni {
					if boni.Attribute == "strength" {
						strength += boni.Value
					}
					if boni.Attribute == "vitality" {
						vitality += boni.Value
					}
				}
			}
		}
	}

	minDamage += strength
	maxDamage += strength

	c.minDamage = minDamage
	c.maxDamage = maxDamage

	fmt.Printf("minDamage %d \n", minDamage)
	fmt.Printf("maxDamage %d \n", maxDamage)
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

func (c *Client) GetPos() shared.Vector {
	c.PosMutex.Lock()
	pos := c.Pos
	c.PosMutex.Unlock()
	return pos
}

func (c *Client) SetPos(newPos shared.Vector) {
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
		event := &BaseEvent{}
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
	client := NewClient(hub, conn, hub.getClientId())

	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
	m.Unlock()
}

func UnmarshalClientEvents(event_data BaseEvent, h *Hub, c *Client) {
	switch event_data.EventType {
	case PLAYER_LOGIN_EVENT:
		// first event the client sends after establishing a websocket connection
		loginPlayerEvent := &LoginPlayerEvent{}
		if err := json.Unmarshal(event_data.Payload, &loginPlayerEvent); err != nil {
			panic(err)
		}
		h.LoginPlayer(loginPlayerEvent.UUID, c)
	case KEYBOARD_EVENT:
		keyboardEvent := &KeyBoardEvent{}
		if err := json.Unmarshal(event_data.Payload, &keyboardEvent); err != nil {
			panic(err)
		}

		h.handleMovementEvent(*keyboardEvent, c)

	case HIT_RESOURCE_EVENT:
		event := &HitResourceEvent{}
		if err := json.Unmarshal(event_data.Payload, &event); err != nil {
			panic(err)
		}
		h.HandleResourceHit(*event, c)

	case HIT_NPC_EVENT:
		event := &HitNpcEvent{}
		if err := json.Unmarshal(event_data.Payload, &event); err != nil {
			panic(err)
		}
		h.HandleNpcHit(*event, c)

	case LOOT_RESOURCE_EVENT:
		event := &LootResourceEvent{}
		if err := json.Unmarshal(event_data.Payload, &event); err != nil {
			panic(err)
		}
		h.HandleLootResource(*event, c)

	case PLAYER_PLACED_RESOURCE_EVENT:
		event := &PlayerPlacedResourceEvent{}

		if err := json.Unmarshal(event_data.Payload, &event); err != nil {
			panic(err)
		}

		h.HandlePlayerPlacedResource(*event, c)

	case PLAYER_CLICKED_GROUND_ITEM_EVENT:
		event := &PlayerClickedItemEvent{}

		if err := json.Unmarshal(event_data.Payload, &event); err != nil {
			panic(err)
		}

		//h.HandlePlayerPlacedResource(*event, c)
		h.PlayerClickedItemEvent(*event, c)

	case PLAYER_CLICKED_INEVNTORY_ITEM_EVENT:

		event := &PlayerClickedInventoryItemEvent{}

		if err := json.Unmarshal(event_data.Payload, &event); err != nil {
			panic(err)
		}

		c.handleInventoryItemClick(event.UUID)
		c.updateStats()
	}

}
