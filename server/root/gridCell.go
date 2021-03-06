package root

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"math"
	"sync"
	"time"
	"ws-game/item"
	"ws-game/resource"
	"ws-game/shared"

	"encoding/base64"
)

const (
	CellUpdateRate = time.Millisecond * 50
)

type GridCell struct {
	Pos                  shared.Vector
	GridCellKey          string
	playerSubscriptions  map[int]GridSubscription // client id to subscription; used for event distribution
	wantsToSub           []*Client
	wantsToSubMutex      sync.Mutex
	wantsToUnSub         []*Client
	wantsToUnSubMutex    sync.Mutex
	playersToRemove      []*Client
	playersToRemoveMutex sync.Mutex
	playersToAdd         []*Client
	playersToAddMutex    sync.Mutex
	Players              map[int]*Client            // players inside this cell atm
	Resources            map[int]*resource.Resource // resources located in this cell
	ResourcesMutex       sync.Mutex
	Items                map[string]*item.Item
	ItemsMutex           sync.Mutex
	Broadcast            chan interface{}
	//Subscribe              chan *Client
	Unsubscribe            chan int
	UpdateSubscriptions    chan bool
	CellMutex              sync.Mutex
	eventsToBroadcast      []interface{}
	eventsToBroadcastMutex sync.Mutex
	SubCells               []SubCell
	NpcList                []Npc
	NpcListMutex           sync.Mutex
	SubCellBase64          string
	ItemsToAdd             []item.Item
	ItemsToAddMutex        sync.Mutex
	ItemsToRemove          []string
	ItemsToRemoveMutex     sync.Mutex
	Active                 bool
	ActiveMutex            sync.Mutex
}

func NewCell(x int, y int) *GridCell {

	subCells := getSubCells(x, y)
	subCellsBase64 := getCellMiniMapPng(subCells)

	cell := &GridCell{
		Pos:                  shared.Vector{X: x, Y: y},
		GridCellKey:          getKey(x, y),
		playerSubscriptions:  make(map[int]GridSubscription),
		wantsToSub:           []*Client{},
		wantsToSubMutex:      sync.Mutex{},
		wantsToUnSub:         []*Client{},
		wantsToUnSubMutex:    sync.Mutex{},
		playersToRemove:      []*Client{},
		playersToRemoveMutex: sync.Mutex{},
		playersToAdd:         []*Client{},
		playersToAddMutex:    sync.Mutex{},
		Players:              make(map[int]*Client),
		Resources:            make(map[int]*resource.Resource),
		ResourcesMutex:       sync.Mutex{},
		Broadcast:            make(chan interface{}, 512),
		//Subscribe:              make(chan *Client),
		Unsubscribe:            make(chan int),
		UpdateSubscriptions:    make(chan bool),
		CellMutex:              sync.Mutex{},
		eventsToBroadcast:      []interface{}{},
		eventsToBroadcastMutex: sync.Mutex{},
		NpcList:                []Npc{},
		NpcListMutex:           sync.Mutex{},
		SubCells:               subCells,
		SubCellBase64:          subCellsBase64,
		Items:                  make(map[string]*item.Item),
		ItemsMutex:             sync.Mutex{},
		ItemsToAdd:             []item.Item{},
		ItemsToAddMutex:        sync.Mutex{},
		ItemsToRemove:          []string{}, // UUID of item to remove
		ItemsToRemoveMutex:     sync.Mutex{},
		Active:                 false,
		ActiveMutex:            sync.Mutex{},
	}

	// test npc -> only one per cell atm
	for i := 0; i < 1; i++ {
		npcPos := shared.Vector{X: (x * GridCellSize), Y: (y * GridCellSize)}
		npc := NewNpc(npcPos)
		cell.NpcList = append(cell.NpcList, npc)
	}

	// spawn some items for testing
	if cell.Pos.X == 0 && cell.Pos.Y == 0 {
		cell.ItemsMutex.Lock()
		cellCenter := shared.Vector{X: (x * GridCellSize) + GridCellSize/2, Y: (y * GridCellSize) + GridCellSize/2}
		for i := 0; i < 5; i++ {
			// start with center
			spawnPos := cellCenter.Copy()
			spawnPos.X += shared.RandIntInRange(-GridCellSize/2, GridCellSize/2)
			spawnPos.Y += shared.RandIntInRange(-GridCellSize/2, GridCellSize/2)

			item := item.NewItem(cell.Pos, 0, spawnPos)
			item.Rarity = "unique"
			cell.Items[item.UUID] = &item
		}
		cell.ItemsMutex.Unlock()
	}

	return cell
}

func (c *GridCell) SpawnItem(pos shared.Vector) {
	c.ItemsToAddMutex.Lock()
	defer c.ItemsToAddMutex.Unlock()

	r := 50
	pos.X += shared.RandIntInRange(-r, r)
	pos.Y += shared.RandIntInRange(-r, r)

	c.ItemsToAdd = append(c.ItemsToAdd, item.NewItem(c.Pos, 0, pos))
}

func getCellMiniMapPng(subCells []SubCell) string {

	var img = image.NewRGBA(image.Rect(0, 0, SubCells, SubCells))

	hue := uint8(255)

	water := color.RGBA{0, 98, 168, hue}
	shallowWater := color.RGBA{67, 199, 247, hue}
	grass := color.RGBA{99, 171, 63, hue}
	sand := color.RGBA{255, 255, 0, hue}

	for _, subCell := range subCells {
		if subCell.TerrainType == "Water" {
			img.Set(subCell.Pos.X, subCell.Pos.Y, water)
		}
		if subCell.TerrainType == "Grass" {
			img.Set(subCell.Pos.X, subCell.Pos.Y, grass)
		}
		if subCell.TerrainType == "ShallowWater" {
			img.Set(subCell.Pos.X, subCell.Pos.Y, shallowWater)
		}
		if subCell.TerrainType == "Sand" {
			img.Set(subCell.Pos.X, subCell.Pos.Y, sand)
		}
	}

	buff := new(bytes.Buffer)
	err := png.Encode(buff, img)
	if err != nil {
		fmt.Println("failed to create buffer", err)
		return ""
	}

	base64String := "data:image/png;base64,"
	base64String += base64.StdEncoding.EncodeToString(buff.Bytes())

	return base64String
}

func Abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func getKey(x int, y int) string {
	return fmt.Sprintf("%d#%d", x, y)
}

func (cell *GridCell) LootItem(uuid string, c *Client) {
	cell.ItemsMutex.Lock()
	defer func() {
		cell.ItemsMutex.Unlock()
	}()

	item, ok := cell.Items[uuid]

	if ok {
		c.ItemInventory = append(c.ItemInventory, *item)

		// remove from ground
		cell.AddEventToBroadcast(NewRemoveItemEvent(uuid))

		c.send <- NewUpdateInventoryItemEvent(*item, false)

		delete(cell.Items, uuid)
	}
}

func (cell *GridCell) GetSubscriptions() []GridSubscription {
	subs := []GridSubscription{}
	cell.CellMutex.Lock()
	//	fmt.Printf("lock for subs %d %d\n", cell.Pos.X, cell.Pos.Y)
	for i := range cell.playerSubscriptions {
		subs = append(subs, cell.playerSubscriptions[i])
	}
	cell.CellMutex.Unlock()
	//	fmt.Printf("unlock for subs %d %d\n", cell.Pos.X, cell.Pos.Y)
	return subs
}
func (cell *GridCell) GetItems() []item.Item {
	cell.ItemsMutex.Lock()
	defer cell.ItemsMutex.Unlock()

	items := []item.Item{}

	for _, item := range cell.Items {
		items = append(items, *item)
	}

	return items

}

func (c *GridCell) RemoveQueuedItems() {
	c.ItemsMutex.Lock()
	c.ItemsToRemoveMutex.Lock()
	c.eventsToBroadcastMutex.Lock()
	defer func() {
		c.ItemsMutex.Unlock()
		c.ItemsToRemoveMutex.Unlock()
		c.eventsToBroadcastMutex.Unlock()
	}()

	for _, itemUUID := range c.ItemsToRemove {
		delete(c.Items, itemUUID)
		c.eventsToBroadcast = append(c.eventsToBroadcast, NewRemoveItemEvent(itemUUID))
	}

	c.ItemsToRemove = []string{}
}

func (c *GridCell) AddQueuedItems() {
	c.ItemsMutex.Lock()
	c.ItemsToAddMutex.Lock()
	c.eventsToBroadcastMutex.Lock()
	defer func() {
		c.ItemsMutex.Unlock()
		c.ItemsToAddMutex.Unlock()
		c.eventsToBroadcastMutex.Unlock()
	}()

	if len(c.ItemsToAdd) == 0 {
		return
	}

	for index := range c.ItemsToAdd {
		item := c.ItemsToAdd[index]
		c.Items[item.UUID] = &item
	}

	c.eventsToBroadcast = append(c.eventsToBroadcast, NewItemPositionsEvent(c.ItemsToAdd, c.GridCellKey))
	c.ItemsToAdd = []item.Item{}

}

func (cell *GridCell) UpdateNpc(index int, npc Npc) {
	defer func() {
		cell.NpcList[index] = npc
	}()

	var player *Client = npc.targetedPlayer
	minDistToAttack := 75.0

	if player != nil && !player.getConnected() {
		npc.targetedPlayer = nil
		return
	}

	// Example: Player disconncts while npc has him targeted
	if npc.State != Idle && npc.State != Returning && player == nil {
		npc.State = Returning
		return
	}

	if npc.State == Idle {
		// either we are in idle with or without a target player

		// see if a player is nearby
		var smallestDist = math.Inf(1)
		if player == nil {
			for _, sub := range cell.playerSubscriptions {
				subbedPlayerPos := sub.Player.GetPos()
				dist := subbedPlayerPos.Dist(&npc.Pos)
				if dist < smallestDist && dist < 150 {
					player = sub.Player
					npc.targetedPlayer = player
					smallestDist = dist
				}
			}

			// return early no matter if we found one or not
			return
		}

		// we have a target player but still in idle state
		// check if we are close enough to attack

		playerPos := player.GetPos()
		if playerPos.Dist(&npc.Pos) < minDistToAttack {
			// npc reached minimum range to player -> attack
			// we are close enough -> change to attack state
			npc.State = Attack
		} else {
			// we are to far away -> run to target
			npc.State = Walk
		}
		return
	}

	if npc.State == Returning {
		diffX := npc.spawnPos.X - npc.Pos.X
		diffY := npc.spawnPos.Y - npc.Pos.Y

		step := shared.Vector{
			X: diffX,
			Y: diffY,
		}

		if Abs(diffX) > StepSize {
			if diffX > 0 {
				step.X = StepSize
			} else {
				step.X = -StepSize
			}
		}
		if Abs(diffY) > StepSize {
			if diffY > 0 {
				step.Y = StepSize
			} else {
				step.Y = -StepSize
			}
		}

		// take step in player direction
		npc.Pos.Add(step)
		cell.AddEventToBroadcast(NewNpcTargetPositionEvent(cell.GridCellKey, npc.UUID, npc.Pos))

		// check if npc is back at spawn
		dist := npc.spawnPos.Dist(&npc.Pos)
		if dist <= 50 {
			npc.State = Idle
		}

		return
	}

	if npc.State == Walk {

		if npc.movementCooldown > 0 {
			npc.movementCooldown -= 1
			return
		}

		// check if npc walked to far away from his spawn position -> switch to return mode
		if npc.spawnPos.Dist(&npc.Pos) > 500 {
			npc.State = Returning
			npc.Hitpoints.Current = npc.Hitpoints.Max

			cell.AddEventToBroadcast(NewUpdateNpcEvent(npc.UUID, npc.Hitpoints.Current, npc.Hitpoints.Max, false, cell.GridCellKey, 0, false))
			npc.targetedPlayer = nil
			return
		}

		playerPos := player.GetPos()
		diffX := playerPos.X - npc.Pos.X
		diffY := playerPos.Y - npc.Pos.Y

		step := shared.Vector{
			X: diffX,
			Y: diffY,
		}

		// limit if step is to big
		if Abs(diffX) > StepSize {
			if diffX > 0 {
				step.X = StepSize
			} else {
				step.X = -StepSize
			}
		}
		if Abs(diffY) > StepSize {
			if diffY > 0 {
				step.Y = StepSize
			} else {
				step.Y = -StepSize
			}
		}

		// take step in player direction
		npc.Pos.Add(step)
		cell.AddEventToBroadcast(NewNpcTargetPositionEvent(cell.GridCellKey, npc.UUID, npc.Pos))

		// check if we are close enough to attack
		if playerPos.Dist(&npc.Pos) < minDistToAttack {
			npc.State = Attack
			return
		}

		npc.State = Idle
		npc.movementCooldown = 2
		return
	}

	// check if we are still in attack range
	if npc.State == Attack && npc.attackCooldown == 0 {
		playerPos := player.GetPos()
		if playerPos.Dist(&npc.Pos) > minDistToAttack {
			npc.State = Walk
			return
		}
	}

	if npc.State == Attack {
		if npc.attackCooldown == 0 {
			npcDamage := shared.RandIntInRange(20, 35)

			crit := shared.RandIntInRange(1, 100) > int(npc.critChance*100)

			if crit {
				npcDamage *= 2
			}

			player.Hitpoints.Current -= npcDamage

			cell.AddEventToBroadcast(NewNpcAttackAnimEvent(npc.UUID, 0))
			cell.AddEventToBroadcast(NewUpdatePlayerEvent(player.Id, player.Hitpoints, npcDamage, 0, crit))

			npc.attackCooldown = npc.AttackSpeed
			npc.movementCooldown = 2
		}
	}
	npc.attackCooldown -= 1
}

func (cell *GridCell) NpcUpdates() {
	// NPC Stuff
	cell.NpcListMutex.Lock()

	defer cell.NpcListMutex.Unlock()

	// Remove npcs
	for i, npc := range cell.NpcList {
		if npc.remove {
			cell.NpcList = append(cell.NpcList[:i], cell.NpcList[i+1:]...)
		}
	}

	// Update Npces
	for index, npc := range cell.NpcList {
		cell.UpdateNpc(index, npc)
	}

}

func (cell *GridCell) CellCoro() {
	ticker := time.NewTicker(CellUpdateRate)
	defer ticker.Stop()

	for {
		select {
		/*
			Update Subs
		*/
		case <-ticker.C:
			// Measure time for cell updates
			// start := time.Now()

			// handle new subscriptions
			// if a client subs to a new cell provide him with players inside this cell
			cell.wantsToSubMutex.Lock()
			for _, client := range cell.wantsToSub {

				isConnected := client.getConnected()

				for _, player := range cell.Players {
					if player.Id == client.Id {
						continue
					}

					if isConnected {
						cell.AddEventToBroadcast(GetNewPlayerEvent(player.Id, player.GetPos(), player.Hitpoints))
					}
				}

				newCellSubscription := !cell.CheckSubscription(client)
				if newCellSubscription && isConnected {
					// this code is executed if a client subs first time to a cell
					client.send <- NewResourcePositionsEvent(cell.GetResources())
					client.send <- NewItemPositionsEvent(cell.GetItems(), cell.GridCellKey)
					client.send <- NewCellDataEvent(cell.GridCellKey, cell.SubCells, cell.Pos, cell.SubCellBase64)

					npcs := cell.GetNpcList()
					client.send <- NewNpcListEvent(cell.GridCellKey, npcs)
				}
			}
			// after all sub request have been processed, set to empty array
			cell.wantsToSub = []*Client{}
			cell.wantsToSubMutex.Unlock()

			// Remove subscriptions from players that moved away or are no longer connected
			movedPlayers := []*Client{}
			eventsToSend := []interface{}{}

			unsubscribePlayerIds := []int{}

			cell.CellMutex.Lock()
			for _, sub := range cell.playerSubscriptions {

				isConnected := sub.Player.getConnected()

				if !isConnected {
					// Not connected? remove client from cells subs
					unsubscribePlayerIds = append(unsubscribePlayerIds, sub.Player.Id)
					continue
				}

				diff := sub.Player.getZoneTick() - sub.SubTick
				if diff > 5 {
					// Unsubscribe connected players that moved a certain distance from the cell
					unsubscribePlayerIds = append(unsubscribePlayerIds, sub.Player.Id)

					if isConnected {
						// Send remove grid event only to connected clients
						// this removes resources from frontend client to stay performant
						movedPlayers = append(movedPlayers, sub.Player)
						eventsToSend = append(eventsToSend, NewRemoveGridCellEvent(cell.GridCellKey))
					}
				}
			}
			cell.CellMutex.Unlock()

			for i := range unsubscribePlayerIds {
				cell.UnsubscribeClient(unsubscribePlayerIds[i])
			}

			for i := range movedPlayers {
				movedPlayers[i].send <- eventsToSend[i]
			}

			// Remove players that are no longer in this cell
			cell.playersToRemoveMutex.Lock()
			for _, c := range cell.playersToRemove {
				delete(cell.Players, c.Id)

				// plays that disconnected -> broadcast remove event
				if !c.Connected {
					cell.AddEventToBroadcast(NewRemovePlayerEvent(c.Id))
				}
			}
			cell.playersToRemove = []*Client{}
			cell.playersToRemoveMutex.Unlock()

			// Add players
			cell.playersToAddMutex.Lock()
			cell.CellMutex.Lock()
			for _, c := range cell.playersToAdd {
				cell.Players[c.Id] = c
				pos := c.GetPos()
				event := GetNewPlayerEvent(c.Id, pos, c.Hitpoints)
				cell.AddEventToBroadcast(event)
			}
			cell.playersToAdd = []*Client{}
			cell.playersToAddMutex.Unlock()
			cell.CellMutex.Unlock()

			cell.NpcUpdates()
			cell.AddQueuedItems()
			// cell.RemoveQueuedItems()

			// broadcast all events at once
			eventsToBroadcast := cell.GetEventsToBroadcast()
			if len(eventsToBroadcast) > 0 {
				event := NewMultipleEvents(eventsToBroadcast)
				for _, sub := range cell.GetSubscriptions() {
					if sub.Player.getConnected() {
						sub.Player.send <- event
					}
				}
				// remove if all done
				cell.eventsToBroadcast = []interface{}{}
				// fmt.Printf("%s loop took %dms\n", cell.GridCellKey, time.Since(start).Milliseconds())
			}

			cell.ActiveMutex.Lock()
			if !cell.Active {
				cell.ActiveMutex.Unlock()
				// stop the corotine for this cell
				return
			}
			cell.ActiveMutex.Unlock()

		/*
			Broadcast
		*/
		case event := <-cell.Broadcast:
			cell.AddEventToBroadcast(event)
		}
	}
}

/*
	Subscribe
*/
func (cell *GridCell) Subscribe(client *Client) {
	cell.wantsToSubMutex.Lock()
	defer cell.wantsToSubMutex.Unlock()

	cell.wantsToSub = append(cell.wantsToSub, client)
}

func (cell *GridCell) ActiveCheck() {
	cell.ActiveMutex.Lock()
	defer cell.ActiveMutex.Unlock()
	if !cell.Active {
		cell.Active = true
		go cell.CellCoro()
	}
}

func (cell *GridCell) AddResource(r *resource.Resource) {
	cell.ResourcesMutex.Lock()
	cell.Resources[r.Id] = r
	cell.ResourcesMutex.Unlock()
}
func (cell *GridCell) AddPlayer(c *Client) {
	cell.playersToAddMutex.Lock()
	cell.playersToAdd = append(cell.playersToAdd, c)
	cell.playersToAddMutex.Unlock()
}

func (cell *GridCell) RemovePlayer(c *Client) {
	cell.playersToRemoveMutex.Lock()
	cell.playersToRemove = append(cell.playersToRemove, c)
	cell.playersToRemoveMutex.Unlock()
}

func (cell *GridCell) RemoveResource(r *resource.Resource) {
	cell.ResourcesMutex.Lock()
	delete(cell.Resources, r.Id)
	cell.ResourcesMutex.Unlock()
}

func (cell *GridCell) isClientSubscribed(cId int) bool {
	cell.CellMutex.Lock()
	_, ok := cell.playerSubscriptions[cId]
	cell.CellMutex.Unlock()
	return ok
}

func (cell *GridCell) UnsubscribeClient(cId int) {
	cell.CellMutex.Lock()
	delete(cell.playerSubscriptions, cId)

	npcHasPlayerTarget := false
	for _, npc := range cell.NpcList {
		if npc.targetedPlayer != nil {
			npcHasPlayerTarget = true
			break
		}
	}

	if len(cell.playerSubscriptions) == 0 && !npcHasPlayerTarget {

		cell.ActiveMutex.Lock()

		// if last player unsubbed active is set to false,
		// cellCoro will return/stop next iteration

		cell.Active = false
		cell.ActiveMutex.Unlock()

	}

	cell.CellMutex.Unlock()
}

func (cell *GridCell) AddEventToBroadcast(event interface{}) {
	cell.eventsToBroadcastMutex.Lock()
	cell.eventsToBroadcast = append(cell.eventsToBroadcast, event)
	cell.eventsToBroadcastMutex.Unlock()
}

func (cell *GridCell) GetEventsToBroadcast() []interface{} {
	cell.eventsToBroadcastMutex.Lock()
	events := cell.eventsToBroadcast
	cell.eventsToBroadcastMutex.Unlock()
	return events
}

func (cell *GridCell) CheckSubscription(c *Client) bool {
	cell.CellMutex.Lock()
	subscription, hasSupped := cell.playerSubscriptions[c.Id]
	if hasSupped {
		// player has already subbed to this cell -> renew by updating the tick value
		subscription.SubTick = c.getZoneTick()
		cell.playerSubscriptions[c.Id] = subscription
	} else {
		cell.playerSubscriptions[c.Id] = GridSubscription{
			Player:  c,
			SubTick: c.getZoneTick(),
		}
	}
	cell.CellMutex.Unlock()
	return hasSupped
}

func (cell *GridCell) GetResources() map[int]resource.Resource {
	resourceMap := make(map[int]resource.Resource)

	cell.ResourcesMutex.Lock()
	for _, r := range cell.Resources {
		if r.GetRemove() {
			delete(cell.Resources, r.Id)
			continue
		}
		resourceMap[r.Id] = *r
	}
	cell.ResourcesMutex.Unlock()

	return resourceMap
}

func (cell *GridCell) GetNpcList() []Npc {
	npcList := []Npc{}

	cell.NpcListMutex.Lock()

	for _, npc := range cell.NpcList {
		//npc.TargetedPlayer = nil
		npcList = append(npcList, npc)
	}

	cell.NpcListMutex.Unlock()

	return npcList
}
