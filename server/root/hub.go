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

	// resources in the world
	Resources []resource.Resource
	ResIdCnt  int
}

const MAX_LOOT_RANGE = 150

func NewHub() *Hub {

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

	for x, col := range gridManager.Grid {
		for y := range col {
			spawnPositions := []shared.Vector{}
			// spawn one resource in center for testing
			spawnPositions = append(spawnPositions, shared.Vector{X: x * (GridCellSize / 2), Y: y * (GridCellSize / 2)})
			//spawnPositions = append(spawnPositions, shared.Vector{X: 50 + x*(GridCellSize/2), Y: 50 - y*(GridCellSize/2)})
			//spawnPositions = append(spawnPositions, shared.Vector{X: x * (GridCellSize / 2), Y: y * (GridCellSize / 2)})
			//spawnPositions = append(spawnPositions, shared.Vector{X: x * (GridCellSize / 2), Y: 50 - y*(GridCellSize/2)})
			for _, pos := range spawnPositions {
				r1 := resource.NewResource(resource.Stone, pos, resourceManager.GetResourceId(), 1, true, 100, false)

				// Store the variable in resource manager
				resourceManager.SetResource(r1)

				// Store adress to this resource in grid manager
				gridManager.AddResource(gridManager.Grid[0][0], r1)
			}
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

		gridCell := h.GridManager.GetCellFromPos(c.Pos)
		gridCell.Broadcast(events.NewPlayerTargetPositionEvent(c.Pos, c.Id))

		if newX != c.GridCell.Pos.X || newY != c.GridCell.Pos.Y {
			// remove client from old cell
			delete(c.GridCell.Players, c.Id)

			// set client to new cell
			c.GridCell = gridCell
			gridCell.Players[c.Id] = c

			h.GridManager.clientMovedCell(gridCell.Pos.X, gridCell.Pos.Y, c)
		}

	}
}

func (h *Hub) HandleResourceHit(event events.HitResourceEvent, c *Client) {
	//toRemoveIndex := -1
	r, err := h.ResourceManager.GetResource(event.Id)
	if err != nil {
		fmt.Printf("Error: %s\n", err)
		return
	}

	dist := r.Pos.Dist((&c.Pos))
	if dist < MAX_LOOT_RANGE {
		r.Hitpoints.Current -= 34

		remove := r.Hitpoints.Current <= 0
		cellToBroadCast := h.GridManager.GetCellFromPos(r.Pos)
		cellToBroadCast.Broadcast(events.NewUpdateResourceEvent(r.Id, r.Hitpoints.Current, r.Hitpoints.Max, remove))

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
		quantity = shared.RandIntInRange(2, 5)
		subType = resource.Brick
	} else if destroyedResource.ResourceType == resource.Tree {
		quantity = shared.RandIntInRange(3, 5)
		subType = resource.Wood
	}

	// create resource of type and quantity
	pos := destroyedResource.Pos.Copy()
	r := resource.NewResource(subType, pos, h.ResourceManager.GetResourceId(), quantity, false, -1, true)

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
		h.broadcast <- events.NewUpdateResourceEvent(r.Id, -1, -1, true)

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
