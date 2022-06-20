package root

import (
	"fmt"
	"ws-game/events"
	"ws-game/resource"
	"ws-game/shared"
)

const (
	GridCellSize = 500
)

type GridSubscription struct {
	Player  *Client
	SubTick int
}

func (sub *GridSubscription) expired() bool {
	return sub.Player.ZoneChangeTick-sub.SubTick > 10
}

type GridCell struct {
	Pos                 shared.Vector
	Key                 string
	PlayerSubscriptions map[int]GridSubscription   // client id to subscription; used for event distribution
	Players             map[int]*Client            // players inside this cell atm
	Resources           map[int]*resource.Resource // resources located in this cell
}

func GetGridCellKey(x int, y int) string {
	return fmt.Sprintf("%d:%d", x, y)
}

func (cell *GridCell) Broadcast(data []byte) {
	for _, sub := range cell.PlayerSubscriptions {
		if sub.Player.Connected {
			sub.Player.send <- data
		} else {
			delete(cell.PlayerSubscriptions, sub.Player.Id)
		}
	}
}

func (gm *GridManager) AddResource(cell GridCell, r *resource.Resource) {
	offsetX := cell.Pos.X * GridCellSize
	offsetY := cell.Pos.Y * GridCellSize
	r.Pos.X += offsetX
	r.Pos.Y += offsetY
	cell.Resources[r.Id] = r
}

func (gm *GridManager) GetCellFromPos(clientPos shared.Vector) *GridCell {
	// get x and y from pos by concidering the grid cell size
	x := clientPos.X / GridCellSize
	y := clientPos.Y / GridCellSize

	row := gm.Grid[x]
	cell, oky := row[y]

	// Todo fix this hacky stuff
	if !oky {
		gm.add(x, y)
	}
	cell = row[y]

	return &cell
}

func NewCell(x int, y int) *GridCell {
	return &GridCell{
		Pos:                 shared.Vector{X: x, Y: y},
		Key:                 GetGridCellKey(x, y),
		PlayerSubscriptions: make(map[int]GridSubscription),
		Players:             make(map[int]*Client),
		Resources:           make(map[int]*resource.Resource),
	}
}

func (cell *GridCell) subscribe(client *Client) {
	// if a client subs to a new cell provide him with players inside this cell
	for _, player := range cell.Players {
		if player.Id == client.Id {
			continue
		}
		client.send <- events.GetNewPlayerEvent(player.Id, player.Pos)
	}

	if subscription, ok := cell.PlayerSubscriptions[client.Id]; ok {
		//fmt.Printf("Renewed sub x: %d y: %d\n", cell.Pos.X, cell.Pos.Y)
		// player has already subbed to this cell -> renew by updating the tick value
		subscription.SubTick = client.ZoneChangeTick
	} else {
		//fmt.Printf("Added   sub x: %d y: %d\n", cell.Pos.X, cell.Pos.Y)
		cell.PlayerSubscriptions[client.Id] = GridSubscription{
			Player:  client,
			SubTick: client.ZoneChangeTick,
		}

		// provide player with resources

		if len(cell.Resources) > 0 {
			resources := make(map[int]resource.Resource)
			for idx, r := range cell.Resources {
				if r.Remove {
					delete(cell.Resources, idx)
				} else {
					resources[r.Id] = *r
				}

			}
			client.send <- events.NewResourcePositionsEvent(resources)
		}
	}
}

type GridManager struct {
	Grid map[int]map[int]GridCell
	Hub  Hub
}

func NewGridManager() *GridManager {

	gm := &GridManager{
		Grid: make(map[int]map[int]GridCell),
	}

	n := 2
	c := 0
	// init cells around 0 0
	for x := -n; x <= n; x++ {
		for y := -n; y <= n; y++ {
			gm.add(x, y)
			fmt.Printf("%d/%d\n", c, n*n*4)
			c++
		}
	}

	return gm
}

func (gm *GridManager) clientMovedCell(newCellX int, newCellY int, client *Client) {
	cells := gm.getCells(newCellX, newCellY)
	fmt.Println(newCellX)
	fmt.Println(newCellY)

	// This counter is increased each zone change
	// the cell subscriptions get assign the tick when the zone was changed
	// if a players subscription for the same zone is renewed he gets zone updates for a longer time
	// if a player moves away from a once subscribed zone the difference between the subscriptions tick value and his current tick value gets bigger
	// if a certain threshold is exceeded, the subscription gets removed and the player wont get no longer updates(events) from that zone
	client.ZoneChangeTick += 1

	for _, cell := range cells {
		cell.subscribe(client)
	}
}

func (gm *GridManager) getCells(x int, y int) []GridCell {
	neighbourCells := []GridCell{}
	for xOffset := -2; xOffset <= 2; xOffset++ {
		for yOffset := -2; yOffset <= 2; yOffset++ {
			xIdx := x + xOffset
			yIdx := x + xOffset
			row, ok := gm.Grid[xIdx]

			if !ok {
				fmt.Printf("Added %d %d\n", xIdx, yIdx)
				gm.add(xIdx, yIdx)
				row = gm.Grid[xIdx]
			}
			cell, cellOk := row[yIdx]
			if !cellOk {
				gm.add(xIdx, yIdx)
				cell = row[yIdx]
			}
			neighbourCells = append(neighbourCells, cell)
		}
	}
	return neighbourCells
}

func (gm *GridManager) add(x int, y int) {
	cell := *NewCell(x, y)
	col, ok := gm.Grid[x]

	if ok {
		// col exists set cell
		col[y] = cell
	} else {
		// add col and add cell
		gm.Grid[x] = make(map[int]GridCell)
		gm.Grid[x][y] = cell
	}
}
