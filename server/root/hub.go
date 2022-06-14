package root

import (
	"fmt"
	"ws-game/events"
	"ws-game/resource"
	"ws-game/shared"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// resources in the world
	Resources []resource.Resource
}

func NewHub(n int) *Hub {

	resources := []resource.Resource{}
	for i := 0; i < n; i++ {
		resources = append(resources, *resource.NewResource(resource.Iron))
	}

	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		Resources:  resources,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

func (h *Hub) new_client(client *Client) {
	new_client_message := []byte(events.GetNewPlayerEvent(client.Id, client.Pos))
	h.broadcast <- new_client_message
}

func (h *Hub) distribMoveEvent(event events.KeyBoardEvent) {
	playerVelocity := shared.Vector{
		X: 0,
		Y: 0,
	}

	if event.Key == "w" {
		playerVelocity.Y = -event.Value
	}

	if event.Key == "a" {
		playerVelocity.X = -event.Value
	}

	if event.Key == "s" {
		playerVelocity.Y = event.Value
	}

	if event.Key == "d" {
		playerVelocity.X = event.Value
	}

	e := events.NewPlayerVelocityEvent(playerVelocity, event.Id)
	for client := range h.clients {
		fmt.Println("is zero?")
		fmt.Println(event.Id)
		client.send <- e
	}
}
