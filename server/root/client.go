package root

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"ws-game/events"
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
	space   = []byte{' '}
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

		// all message recieved from client get unmarshalled to structs
		UnmarshalClientEvents(message, c.hub)

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
func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256), Id: id_cnt, Pos: shared.Vector{X: shared.RandIntInRange(-75, 75), Y: shared.RandIntInRange(-75, 75)}}
	client.send <- events.GetAssignUserIdEvent(id_cnt)

	// provide the new player with all players positions
	for c := range hub.clients {
		new_client_message := []byte(events.GetNewPlayerEvent(c.Id, c.Pos))
		client.send <- new_client_message
	}

	// provide the new player with all resources
	client.send <- events.NewResourcePositionsEvent(hub.Resources)

	client.hub.register <- client
	hub.new_client(client)
	id_cnt += 1

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
}

func UnmarshalClientEvents(jsonInput []byte, h *Hub) {
	event_data := &events.BaseEvent{}
	if err := json.Unmarshal(jsonInput, &event_data); err != nil {
		x := fmt.Sprintf("Non event message %s", string(jsonInput))
		println(x)
		return
	}

	switch event_data.EventType {
	case events.KEYBOARD_EVENT:
		keyboardEvent := &events.KeyBoardEvent{}
		if err := json.Unmarshal(event_data.Payload, &keyboardEvent); err != nil {
			panic(err)
		}

		for client := range h.clients {
			if client.Id == keyboardEvent.Id {
				h.handleMovementEvent(*keyboardEvent, client)
			}
		}

	}
}
