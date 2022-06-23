package root

import (
	"fmt"
	"ws-game/events"
	"ws-game/resource"
	"ws-game/shared"
)

// Hub maintains the set of active clients and broadcasts messages to them
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
}

const MAX_LOOT_RANGE = 150

func NewHub() *Hub {

	hub := &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[int]*Client),
	}

	c := make(chan *GridCell)

	go hub.initializeCellResources(c)
	hub.GridManager = NewGridManager(&c)
	hub.ResourceManager = resource.NewResourceManager()

	return hub
}

func (h *Hub) spawnResource(cell *GridCell, r *resource.Resource) {
	// Store the variable in resource manager
	h.ResourceManager.SetResource(r)
	// Store adress to this resource in grid manager
	cell.mutex.Lock()
	cell.Resources[r.Id] = r
	cell.mutex.Unlock()
}

func (h *Hub) initializeCellResources(channel chan *GridCell) {
	for {
		cell := <-channel
		// spawn Stones
		oX := shared.RandIntInRange(-25, 25)
		oY := shared.RandIntInRange(-25, 25)
		for i := 0; i < shared.RandIntInRange(1, 50); i++ {
			x := (cell.Pos.X * GridCellSize) - GridCellSize/2 + shared.RandIntInRange(-250, 250) + oX
			y := (cell.Pos.Y * GridCellSize) - GridCellSize/2 + shared.RandIntInRange(-250, 250) + oY
			pos := shared.Vector{X: x, Y: y}
			id := h.ResourceManager.GetResourceId()
			r := resource.NewResource(resource.Stone, pos, id, 100, true, 100, false, cell.GridCellKey)
			h.spawnResource(cell, r)
		}

		// spawn trees
		for n := 0; n < shared.RandIntInRange(2, 50); n++ {
			x := (cell.Pos.X * GridCellSize) + shared.RandIntInRange(0, GridCellSize)
			y := (cell.Pos.Y * GridCellSize) + shared.RandIntInRange(0, GridCellSize)
			pos := shared.Vector{X: x, Y: y}
			id := h.ResourceManager.GetResourceId()
			r := resource.NewResource(resource.Tree, pos, id, 100, true, 100, false, cell.GridCellKey)
			h.spawnResource(cell, r)
		}
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client.Id] = client
			client.send <- events.NewLoadInventoryEvent(client.Inventory)
		case client := <-h.unregister:
			if _, ok := h.clients[client.Id]; ok {

				for _, sub := range client.GridCell.PlayerSubscriptions {
					if sub.Player.Id == client.Id {
						continue
					}

					if sub.Player.Connected {
						sub.Player.send <- events.NewRemovePlayerEvent(client.Id)
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

	stepSize := 10
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
	for _, resource := range c.GridCell.Resources {

		if resource.Remove {
			delete(c.GridCell.Resources, resource.Id)
			continue
		}
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

		gridCell := h.GridManager.GetCellFromPos(c.Pos)
		gridCell.Broadcast(events.NewPlayerTargetPositionEvent(c.Pos, c.Id))

		if newX != c.GridCell.Pos.X || newY != c.GridCell.Pos.Y {
			h.GridManager.clientMovedCell(*c.GridCell, *gridCell, c)
		}

	}
}

func (h *Hub) HandleResourceHit(event events.HitResourceEvent, c *Client) {
	r, err := h.ResourceManager.GetResource(event.Id)
	fmt.Printf("cell key %s\n", r.GridCellKey)
	fmt.Printf("resource id %d\n", r.Id)
	if err != nil {
		fmt.Printf("Error: %s\n", err)
		return
	}

	if r.Remove {
		return
	}

	dist := r.Pos.Dist((&c.Pos))
	if dist < MAX_LOOT_RANGE {
		r.Hitpoints.Current -= 34

		remove := r.Hitpoints.Current <= 0
		cellToBroadCast := h.GridManager.GetCellFromPos(r.Pos)
		cellToBroadCast.Broadcast(events.NewUpdateResourceEvent(r.Id, r.Hitpoints.Current, r.Hitpoints.Max, remove, r.GridCellKey))

		if r.Hitpoints.Current <= 0 {
			h.SpawnLoot(*r, c)
			h.RemoveResource(r)
		}

		// update the changed resource
		h.ResourceManager.SetResource(r)
	}

}

func (h *Hub) SpawnLoot(destroyedResource resource.Resource, c *Client) {
	// Spawn subtype resources

	// check how many should be spawned

	//Todo: Add this as function in resource handler -> Get getloot from resource
	quantity := 0
	subType := resource.Brick
	if destroyedResource.ResourceType == resource.Stone {
		quantity = shared.RandIntInRange(1, 3)
		subType = resource.Brick
	} else if destroyedResource.ResourceType == resource.Blockade {
		quantity = 5
		subType = resource.Brick
	} else if destroyedResource.ResourceType == resource.Tree {
		quantity = shared.RandIntInRange(3, 5)
		subType = resource.Log
		fmt.Println("spawned log")
	}

	// create resource of type and quantity
	pos := destroyedResource.Pos.Copy()
	r := resource.NewResource(subType, pos, h.ResourceManager.GetResourceId(), quantity, false, -1, true, destroyedResource.GridCellKey)

	cellToBroadCast := h.GridManager.GetCellFromPos(r.Pos)
	// set on cell
	cellToBroadCast.Resources[r.Id] = r
	// set to resource manager
	h.ResourceManager.SetResource(r) //resources[r.Id] = &r

	// add function that broadcasts single resource
	newResources := make(map[int]resource.Resource)
	newResources[r.Id] = *r
	cellToBroadCast.Broadcast(events.NewResourcePositionsEvent(newResources))
}

func (h *Hub) HandleLootResource(event events.LootResourceEvent, c *Client) {

	r, err := h.ResourceManager.GetResource(event.Id)
	if err != nil {
		fmt.Printf("Error: %s\n", err)
		return
	}

	if r.Pos.Dist((&c.Pos)) < MAX_LOOT_RANGE {
		// Handle looting
		if invRes, ok := c.Inventory[r.ResourceType]; ok {
			// already exists in inventory
			invRes.Quantity += r.Quantity
			c.Inventory[r.ResourceType] = invRes
		} else {
			c.Inventory[r.ResourceType] = *r
		}

		// broadcast update event that removes the resource
		h.broadcast <- events.NewUpdateResourceEvent(r.Id, -1, -1, true, r.GridCellKey)
		c.send <- events.NewUpdateInventoryEvent(*r, false)

		h.RemoveResource(r)
	}
}

func (h *Hub) RemoveResource(r *resource.Resource) {
	h.ResourceManager.DeleteResource(r.Id)
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
				r := &resource.Resource{ResourceType: resource.ResourceType(event.ResourceType),
					Pos:      event.Pos,
					Id:       h.ResourceManager.GetResourceId(),
					Quantity: 1,
					Hitpoints: resource.Hitpoints{
						Current: 500,
						Max:     500},
					IsSolid:    true,
					IsLootable: false,
				}
				rMap := make(map[int]resource.Resource)
				rMap[r.Id] = *r

				cell := h.GridManager.GetCellFromPos(event.Pos)
				fmt.Printf("placed resource in %d %d\n", cell.Pos.X, cell.Pos.Y)
				h.spawnResource(cell, r)

				c.send <- events.NewUpdateInventoryEvent(*r, true)
				cell.Broadcast(events.NewResourcePositionsEvent(rMap))

			}
		}

	}
}
