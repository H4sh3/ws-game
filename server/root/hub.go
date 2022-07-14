package root

import (
	"fmt"
	"sync"
	"ws-game/item"
	"ws-game/resource"
	"ws-game/shared"

	gUUID "github.com/google/uuid"
)

// includes informations that are stored between connect / disconnect
// - inventory
// - position
type ClientPersistance struct {
	Pos           shared.Vector
	Inventory     map[resource.ResourceType]resource.Resource
	ItemInventory []item.Item
	Hitpoints     shared.Hitpoints
}

// Hub maintains the set of active clients and broadcasts messages to them
type Hub struct {
	// Registered clients.
	clients     map[int]*Client
	ClientMutex sync.Mutex

	persistedClientData map[string]ClientPersistance

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	GridManager     *GridManager
	ResourceManager *ResourceManager

	idCnt      int
	idCntMutex sync.Mutex

	gameConfig GameConfig
}

const MAX_LOOT_RANGE = 150

func NewHub() *Hub {

	hub := &Hub{
		register:            make(chan *Client),
		unregister:          make(chan *Client),
		clients:             make(map[int]*Client),
		persistedClientData: make(map[string]ClientPersistance),
		ClientMutex:         sync.Mutex{},
		idCnt:               0,
		idCntMutex:          sync.Mutex{},
		gameConfig: GameConfig{
			GridCellSize:   GridCellSize,
			SubCells:       SubCells,
			PlayerStepSize: StepSize,
			SubCellSize:    SubCellSize,
		},
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
			persistanceEntry := ClientPersistance{
				Pos:           client.Pos,
				Inventory:     client.ResourceInventory,
				ItemInventory: client.ItemInventory,
				Hitpoints:     client.Hitpoints,
			}
			h.persistedClientData[client.UUID] = persistanceEntry

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

func (h *Hub) handleMovementEvent(event KeyBoardEvent, c *Client) {
	newPos := &shared.Vector{X: c.Pos.X, Y: c.Pos.Y}

	if event.Key == "w" {
		newPos.Y -= StepSize
	}

	if event.Key == "a" {
		newPos.X -= StepSize
	}

	if event.Key == "s" {
		newPos.Y += StepSize
	}

	if event.Key == "d" {
		newPos.X += StepSize
	}

	collision := false
	for _, resource := range c.getGridCell().GetResources() {

		if resource.GetRemove() {
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
		c.SetPos(*newPos)
		h.GridManager.UpdateClientPosition <- c
	}
}

func (h *Hub) HandleResourceHit(event HitResourceEvent, c *Client) {
	r, err := h.ResourceManager.GetResource(event.Id)

	if err != nil {
		return
	}

	if r.GetRemove() {
		return
	}

	dist := r.Pos.Dist((&c.Pos))
	if dist < MAX_LOOT_RANGE {
		damage := shared.RandIntInRange(30, 60)
		r.Hitpoints.Current -= damage

		remove := r.Hitpoints.Current <= 0
		cellToBroadCast := h.GridManager.GetCellFromPos(r.Pos)
		cellToBroadCast.Broadcast <- NewUpdateResourceEvent(r.Id, r.Hitpoints.Current, r.Hitpoints.Max, remove, r.GridCellKey, damage)

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

		shouldSpawnIronOre := shared.RandIntInRange(1, 10)

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

func (h *Hub) HandleLootResource(event LootResourceEvent, c *Client) {

	r, err := h.ResourceManager.GetResource(event.Id)
	if err != nil {
		fmt.Printf("Error: %s\n", err)
		return
	}

	if r.Pos.Dist((&c.Pos)) < MAX_LOOT_RANGE {
		// Handle looting
		if invRes, ok := c.ResourceInventory[r.ResourceType]; ok {
			// already exists in inventory
			invRes.Quantity += r.Quantity
			c.ResourceInventory[r.ResourceType] = invRes
		} else {
			c.ResourceInventory[r.ResourceType] = *r
		}

		// broadcast update event that removes the resource
		cell := h.GridManager.GetCellFromPos(r.Pos)
		cell.Broadcast <- NewUpdateResourceEvent(r.Id, -1, -1, true, r.GridCellKey, 0)

		// Todo broadcast UpdateResourceEvent to clients subbed to cell

		resourceToAddToInventry := resource.ResourceMin{
			Quantity:     r.Quantity,
			ResourceType: r.ResourceType,
		}

		c.send <- NewUpdateInventoryEvent(resourceToAddToInventry, false)

		h.ResourceManager.DeleteResource(r.Id)
	}
}

func (h *Hub) buildResource(c *Client, costs int, ingredientResource resource.ResourceType, buildResource resource.ResourceType, pos shared.Vector, hitpoints int) {
	if invRes, ok := c.ResourceInventory[ingredientResource]; ok {
		// check if enough materials in inventory to build this resource

		if invRes.Quantity >= costs {
			invRes.Quantity -= costs
			c.ResourceInventory[ingredientResource] = invRes

			buildResource := &resource.Resource{ResourceType: buildResource,
				Pos:      pos,
				Id:       h.ResourceManager.GetResourceId(),
				Quantity: 1,
				Hitpoints: shared.Hitpoints{
					Current: hitpoints,
					Max:     hitpoints,
				},
				IsSolid:    true,
				IsLootable: false,
			}

			h.ResourceManager.AddResource <- buildResource

			// translate build resource to inventory update

			resourceToRemoveFromInventry := resource.ResourceMin{
				Quantity:     5,
				ResourceType: ingredientResource,
			}

			c.send <- NewUpdateInventoryEvent(resourceToRemoveFromInventry, true)
		}
	}
}

func (h *Hub) HandlePlayerPlacedResource(event PlayerPlacedResourceEvent, c *Client) {
	if event.ResourceType == string(resource.Blockade) {
		costs := 5
		buildResource := resource.Blockade
		ingredientResource := resource.Brick
		h.buildResource(c, costs, ingredientResource, buildResource, event.Pos, 500)
	}

	if event.ResourceType == string(resource.WoodBlockade) {
		costs := 5
		buildResource := resource.WoodBlockade
		ingredientResource := resource.Log
		h.buildResource(c, costs, ingredientResource, buildResource, event.Pos, 200)
	}
}

func (h *Hub) LoginPlayer(uuid string, client *Client) {

	h.ClientMutex.Lock()
	persistanceEntry, ok := h.persistedClientData[uuid]
	h.ClientMutex.Unlock()

	if ok {
		fmt.Printf("existing client with uuid %s", uuid)
		// already logged in
		client.UUID = uuid
		client.Pos = persistanceEntry.Pos
		client.ResourceInventory = persistanceEntry.Inventory
		client.ItemInventory = persistanceEntry.ItemInventory
		client.Hitpoints = persistanceEntry.Hitpoints
	} else {
		// Initialize new client
		uuid := gUUID.New().String()
		client.UUID = uuid
		inventory := make(map[resource.ResourceType]resource.Resource)
		inventory[resource.Brick] = *resource.NewResource(resource.Brick, shared.Vector{}, h.ResourceManager.GetResourceId(), 50, false, 100, false, "")
		client.ResourceInventory = inventory
	}

	client.send <- NewUserInitEvent(client, h.gameConfig)

	gridCell := h.GridManager.GetCellFromPos(client.Pos)
	gridCell.AddPlayer(client)
	for _, cell := range h.GridManager.getCells(gridCell.Pos.X/GridCellSize, gridCell.Pos.Y/GridCellSize) {
		cell.Subscribe <- client
	}
}

func (h *Hub) HandleNpcHit(event HitNpcEvent, client *Client) {
	clientPos := client.GetPos()
	cells := h.GridManager.getCells(clientPos.X/GridCellSize, clientPos.Y/GridCellSize)

	for _, cell := range cells {
		cell.NpcListMutex.Lock()
		for npcIndex, npc := range cell.NpcList {
			if npc.UUID == event.UUID {
				damage := shared.RandIntInRange(34, 50)
				npc.Hitpoints.Current -= damage
				remove := npc.Hitpoints.Current <= 0

				if remove {
					npc.SetRemove(true)

					// spawn some loot
					for i := 0; i < 5; i++ {
						cell.SpawnItem(npc.Pos)
					}
				}

				cell.NpcList[npcIndex] = npc
				cell.Broadcast <- NewUpdateNpcEvent(npc.UUID, cell.NpcList[npcIndex].Hitpoints.Current, cell.NpcList[npcIndex].Hitpoints.Max, remove, cell.GridCellKey, damage)
			}
		}
		cell.NpcListMutex.Unlock()
	}
}

func (h *Hub) PlayerClickedItemEvent(event PlayerClickedItemEvent, c *Client) {
	cell := h.GridManager.GetCell(event.GridCellPos.X, event.GridCellPos.Y)
	cell.LootItem(event.UUID, c)

	// Todo: Add item to clients items inventory
}
