package root

import (
	"fmt"
	"sync"
	"ws-game/events"
	"ws-game/resource"
	"ws-game/shared"

	gUUID "github.com/google/uuid"
)

// Hub maintains the set of active clients and broadcasts messages to them
type Hub struct {
	// Registered clients.
	clients     map[int]*Client
	ClientMutex sync.Mutex

	existingClients map[string]shared.Vector

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	GridManager     *GridManager
	ResourceManager *ResourceManager

	idCnt      int
	idCntMutex sync.Mutex
}

const MAX_LOOT_RANGE = 150

func NewHub() *Hub {

	hub := &Hub{
		register:        make(chan *Client),
		unregister:      make(chan *Client),
		clients:         make(map[int]*Client),
		existingClients: make(map[string]shared.Vector),
		ClientMutex:     sync.Mutex{},
		idCnt:           0,
		idCntMutex:      sync.Mutex{},
	}

	initCellChannel := make(chan *GridCell)

	gm := NewGridManager(initCellChannel)
	hub.GridManager = gm
	hub.ResourceManager = NewResourceManager(gm, initCellChannel)

	return hub
}

func (h *Hub) getClientId() int {
	h.idCntMutex.Lock()
	id := h.idCnt
	h.idCnt++
	fmt.Println(h.idCnt)
	h.idCntMutex.Unlock()
	return id
}

func (h *Hub) SetClient(c *Client) {
	h.ClientMutex.Lock()
	h.clients[c.Id] = c
	h.ClientMutex.Unlock()
}

func (h *Hub) GetClient(id int) *Client {
	h.ClientMutex.Lock()
	c := h.clients[id]
	h.ClientMutex.Unlock()
	return c
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.SetClient(client)
		case client := <-h.unregister:
			h.ClientMutex.Lock()
			if _, ok := h.clients[client.Id]; ok {
				fmt.Printf("Unregister: %d\n", client.Id)
				client.setConnected(false)

				// remove from its cell
				client.GridCell.RemovePlayer(client)

				// remove from hub
				delete(h.clients, client.Id)
				close(client.send)
				client.conn.Close()
			}
			// store client progress in storage
			h.existingClients[client.UUID] = client.Pos

			h.ClientMutex.Unlock()
			/* 		case message := <-h.broadcast:
			for clientId := range h.clients {
				select {
				case h.clients[clientId].send <- message:
				default:
					close(h.clients[clientId].send)
					delete(h.clients, clientId)
				}
			}*/
		}
	}
}

func (h *Hub) handleMovementEvent(event events.KeyBoardEvent, c *Client) {
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
	for _, resource := range c.getGridCell().GetResources() {

		if resource.Remove {
			c.GridCell.RemoveResource(&resource)
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
		c.setPos(*newPos)
		h.GridManager.UpdateClientPosition <- c
	}
}

func (h *Hub) HandleResourceHit(event events.HitResourceEvent, c *Client) {
	r, err := h.ResourceManager.GetResource(event.Id)

	if err != nil {
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
		cellToBroadCast.Broadcast <- events.NewUpdateResourceEvent(r.Id, r.Hitpoints.Current, r.Hitpoints.Max, remove, r.GridCellKey)

		if r.Hitpoints.Current <= 0 {
			h.SpawnLoot(*r, c)
			h.ResourceManager.DeleteResource(r.Id)
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

	newResources := []*resource.Resource{}

	if destroyedResource.ResourceType == resource.Stone {
		quantity = shared.RandIntInRange(2, 5)
		subType = resource.Brick
		pos := destroyedResource.Pos.Copy()
		r := resource.NewResource(subType, pos, h.ResourceManager.GetResourceId(), quantity, false, -1, true, destroyedResource.GridCellKey)
		newResources = append(newResources, r)

		shouldSpawnIronOre := shared.RandIntInRange(0, 10)
		fmt.Printf("shouldSpawnIronOre %d\n", shouldSpawnIronOre)
		if shouldSpawnIronOre >= 7 {
			quantity = shared.RandIntInRange(1, 3)
			subType = resource.IronOre
			pos := destroyedResource.Pos.Copy()
			pos.X += shared.RandIntInRange(-20, 20)
			pos.Y += shared.RandIntInRange(-20, 20)
			r := resource.NewResource(subType, pos, h.ResourceManager.GetResourceId(), quantity, false, -1, true, destroyedResource.GridCellKey)
			newResources = append(newResources, r)
		}
	} else if destroyedResource.ResourceType == resource.Blockade {
		quantity = 5
		subType = resource.Brick
		pos := destroyedResource.Pos.Copy()
		r := resource.NewResource(subType, pos, h.ResourceManager.GetResourceId(), quantity, false, -1, true, destroyedResource.GridCellKey)
		newResources = append(newResources, r)
	} else if destroyedResource.ResourceType == resource.Tree {
		quantity = shared.RandIntInRange(3, 5)
		subType = resource.Log
		pos := destroyedResource.Pos.Copy()
		r := resource.NewResource(subType, pos, h.ResourceManager.GetResourceId(), quantity, false, -1, true, destroyedResource.GridCellKey)
		newResources = append(newResources, r)
	}

	for _, r := range newResources {
		h.ResourceManager.AddResource <- r
	}
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
		cell := h.GridManager.GetCellFromPos(r.Pos)
		cell.Broadcast <- events.NewUpdateResourceEvent(r.Id, -1, -1, true, r.GridCellKey)

		// Todo broadcast UpdateResourceEvent to clients subbed to cell

		c.send <- events.NewUpdateInventoryEvent(*r, false)

		h.ResourceManager.DeleteResource(r.Id)
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

				h.ResourceManager.AddResource <- r
				c.send <- events.NewUpdateInventoryEvent(*r, true)
			}
		}

	}
}

func (h *Hub) LoginPlayer(uuid string, client *Client) {

	h.ClientMutex.Lock()
	pos, ok := h.existingClients[uuid]
	fmt.Println(h.existingClients)
	h.ClientMutex.Unlock()

	if ok {
		fmt.Printf("existing client with uuid %s", uuid)
		// already logged in
		client.UUID = uuid
		client.Pos = pos
	} else {
		uuid := gUUID.New().String()
		client.UUID = uuid
	}

	client.send <- events.GetAssignUserIdEvent(client.Id, client.Pos, client.UUID)
	inventory := make(map[resource.ResourceType]resource.Resource)
	inventory[resource.Brick] = *resource.NewResource(resource.Brick, shared.Vector{}, h.ResourceManager.GetResourceId(), 50, false, 100, false, "")
	client.Inventory = inventory
	client.send <- events.NewLoadInventoryEvent(client.Inventory)

}
