package root

import (
	"fmt"
	"ws-game/events"
	"ws-game/resource"
	"ws-game/shared"
)

const MAX_LOOT_RANGE = 150

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[int]*Client

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	GridManager     *GridManager
	ResourceManager *resource.ResourceManager

	// resources in the world
	Resources []resource.Resource
	ResIdCnt  int
}

func NewHub(n int) *Hub {

	gridManager := NewGridManager()
	resourceManager := resource.NewResourceManager()

	hub := &Hub{
		broadcast:       make(chan []byte),
		register:        make(chan *Client),
		unregister:      make(chan *Client),
		clients:         make(map[int]*Client),
		GridManager:     gridManager,
		ResourceManager: resourceManager,
		ResIdCnt:        0,
	}

	for _, row := range gridManager.Grid {
		for _, col := range row {
			r1 := resource.NewResource(resource.Stone, shared.Vector{X: 250, Y: 250}, resourceManager.GetResourceId(), 1, true, 100, false)
			resourceManager.Add(&r1)
			gridManager.AddResource(col, &r1)
		}
	}

	return hub
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client.Id] = client
		case client := <-h.unregister:
			if _, ok := h.clients[client.Id]; ok {

				for _, sub := range client.GridCell.PlayerSubscriptions {
					if sub.Player.Id == client.Id {
						continue
					}

					if sub.Player.Connected {
						sub.Player.send <- events.NewPlayerDisconnectedEvent(client.Id)
					}
				}

				// remove from its cell
				delete(client.GridCell.Players, client.Id)

				// remove from hub
				delete(h.clients, client.Id)
				client.Connected = false
				close(client.send)
			}
		case message := <-h.broadcast:
			for clientId := range h.clients {
				select {
				case h.clients[clientId].send <- message:
				default:
					close(h.clients[clientId].send)
					delete(h.clients, clientId)
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

		// check if cell changed
		newX := c.Pos.X / GridCellSize
		newY := c.Pos.Y / GridCellSize

		if newX != c.GridCell.Pos.X || newY != c.GridCell.Pos.Y {
			// client is no longer in old cell
			delete(c.GridCell.Players, c.Id)

			// set client to new cell
			gridCell := h.GridManager.GetCellFromPos(c.Pos)
			fmt.Printf("client with id: %d moved to cell %d %d\n", c.Id, gridCell.Pos.X, gridCell.Pos.Y)
			c.GridCell = gridCell
			gridCell.Players[c.Id] = c

			for _, surroudingCells := range h.GridManager.getCells(gridCell.Pos.X, gridCell.Pos.Y) {
				surroudingCells.subscribe(c)
			}
		}

	}

	h.broadcast <- events.NewPlayerTargetPositionEvent(c.Pos, c.Id)
}

func (h *Hub) HandleResourceHit(event events.HitResourceEvent, c *Client) {
	//toRemoveIndex := -1

	resourceDestroyed := false
	r := h.ResourceManager.Resources[event.Id]
	if r == nil {
		fmt.Println("is nil")
		return
	}
	if r.Pos.Dist((&c.Pos)) < MAX_LOOT_RANGE {
		r.Hitpoints.Current -= 34

		remove := r.Hitpoints.Current <= 0
		h.broadcast <- events.NewUpdateResourceEvent(r.Id, r.Hitpoints.Current, r.Hitpoints.Max, remove)

		if r.Hitpoints.Current <= 0 {
			h.ResourceManager.Resources[event.Id].Remove = true
			delete(h.ResourceManager.Resources, event.Id)
			resourceDestroyed = true
		}
	}

	if resourceDestroyed {
		// spawn subtype resources

		// check how many should be spawned
		quantity := 0
		subType := resource.Brick
		if r.ResourceType == resource.Stone {
			quantity = shared.RandIntInRange(1, 3)
			subType = resource.Brick
		} else if r.ResourceType == resource.Blockade {
			quantity = shared.RandIntInRange(2, 5)
			subType = resource.Brick
		} else if r.ResourceType == resource.Tree {
			quantity = shared.RandIntInRange(3, 5)
			subType = resource.Wood
		}

		// create resource of type and quantity
		pos := shared.Vector{X: r.Pos.X, Y: r.Pos.Y}
		r := resource.NewResource(subType, pos, h.ResourceManager.GetResourceId(), quantity, false, -1, true)

		cellToBroadCast := h.GridManager.GetCellFromPos(r.Pos)
		// set on cell
		cellToBroadCast.Resources[r.Id] = &r
		// set to resource manager
		h.ResourceManager.Resources[r.Id] = &r

		// add function that broadcasts single resource
		newResources := make(map[int]resource.Resource)
		newResources[r.Id] = r
		cellToBroadCast.Broadcast(events.NewResourcePositionsEvent(newResources))
		// h.Resources = append(h.Resources, newResources...)

		// Use Grid broadcast for this!
		// h.broadcast <- events.NewResourcePositionsEvent(newResources)
	}
}

func (h *Hub) HandleLootResource(event events.LootResourceEvent, c *Client) {

	r := h.ResourceManager.Resources[event.Id]

	if r.Pos.Dist((&c.Pos)) < MAX_LOOT_RANGE {
		r.Remove = true
		if invRes, ok := c.Inventory[r.ResourceType]; ok {
			// already exists in inventory
			invRes.Quantity += r.Quantity
			c.Inventory[r.ResourceType] = invRes
		} else {
			c.Inventory[r.ResourceType] = *r
		}

		// broadcast update event that removes the resource
		h.broadcast <- events.NewUpdateResourceEvent(r.Id, -1, -1, true)

		delete(h.ResourceManager.Resources, event.Id)
	}
}

func (h *Hub) HandlePlayerPlacedResource(event events.PlayerPlacedResourceEvent, c *Client) {
	// blockade is 5 bricks

	if event.ResourceType == string(resource.Blockade) {
		costs := 5
		if invRes, ok := c.Inventory[resource.Brick]; ok {
			// check if enough materials in inventory to build this resource
			if invRes.Quantity >= costs {
				invRes.Quantity -= costs
				c.Inventory[resource.Brick] = invRes
				r := resource.Resource{ResourceType: resource.ResourceType(event.ResourceType),
					Pos:      event.Pos,
					Id:       h.ResIdCnt,
					Quantity: 1,
					Hitpoints: resource.Hitpoints{
						Current: 500,
						Max:     500},
					IsSolid:    true,
					IsLootable: false,
				}
				h.ResIdCnt += 1
				rMap := make(map[int]resource.Resource)
				rMap[r.Id] = r
				h.broadcast <- events.NewResourcePositionsEvent(rMap)
				h.Resources = append(h.Resources, r)
			}
		}

	}
}
