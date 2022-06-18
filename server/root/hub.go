package root

import (
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
	ResIdCnt  int
}

func NewHub(n int) *Hub {

	resources := []resource.Resource{}

	hub := &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		Resources:  resources,
		ResIdCnt:   0,
	}

	for x := 1; x < n; x++ {
		for y := 1; y < n; y++ {
			pos := shared.Vector{
				X: 100 * x,
				Y: 100 * y,
			}
			resources = append(resources, *resource.NewResource(resource.Stone, pos, hub.ResIdCnt, true, 100))
			hub.ResIdCnt++
		}
	}

	hub.Resources = append(hub.Resources, resources...)

	return hub
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				for c := range h.clients {
					if c.Id == client.Id {
						continue
					}
					c.send <- events.NewPlayerDisconnectedEvent(client.Id)
				}
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

func (h *Hub) handleMovementEvent(event events.KeyBoardEvent, c *Client) {

	stepSize := 5
	newPos := &shared.Vector{X: c.Pos.X, Y: c.Pos.Y}

	if event.Key == "w" {
		newPos.Y -= stepSize
	}

	if event.Key == "a" {
		newPos.X -= stepSize
	}

	if event.Key == "s" {
		newPos.Y += stepSize
	}

	if event.Key == "d" {
		newPos.X += stepSize
	}

	collision := false
	for _, resource := range h.Resources {
		if !resource.IsSolid {
			continue
		}
		if newPos.Dist(&resource.Pos) < 40 {
			collision = true
			break
		}
	}

	if !collision {
		c.Pos = *newPos
	}

	h.broadcast <- events.NewPlayerTargetPositionEvent(c.Pos, c.Id)
}

func (h *Hub) HandleResourceHit(event events.HitResourceEvent, c *Client) {
	toRemoveIndex := -1
	for i := range h.Resources {
		if h.Resources[i].Hitpoints.Max == -1 {
			continue
		}

		if h.Resources[i].Id == event.Id {
			resource := &h.Resources[i]
			resource.Hitpoints.Current -= 10

			// Even broadcast updates with resources below 0 hp to inform the client to destroy this resource
			h.broadcast <- events.NewUpdateResourceEvent(resource.Id, resource.Hitpoints.Current, resource.Hitpoints.Max)

			if resource.Hitpoints.Current <= 0 {
				toRemoveIndex = i
			}
		}
	}

	if toRemoveIndex != -1 {
		// spawn subtype resources

		if h.Resources[toRemoveIndex].ResourceType == resource.Stone {
			newResources := []resource.Resource{}
			for i := 0; i < 3; i++ {
				pos := shared.Vector{X: h.Resources[toRemoveIndex].Pos.X, Y: h.Resources[toRemoveIndex].Pos.Y}
				pos.X += shared.RandIntInRange(-10, 10)
				pos.Y += shared.RandIntInRange(-10, 10)
				resource := resource.NewResource(resource.Brick, pos, h.ResIdCnt, false, -1)
				newResources = append(newResources, *resource)
				h.ResIdCnt++
			}
			h.Resources = append(h.Resources, newResources...)
			h.broadcast <- events.NewResourcePositionsEvent(newResources)
		}

		// resource got destroyed -> remove resource
		h.Resources = append(h.Resources[:toRemoveIndex], h.Resources[toRemoveIndex+1:]...)
	}
}
