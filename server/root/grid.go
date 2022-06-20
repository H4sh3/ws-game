package root

import (
	"fmt"
	"ws-game/events"
	"ws-game/resource"
	"ws-game/shared"
)

const (
	GridCellSize = 100
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
	PlayerSubscriptions map[int]GridSubscription // client id to subscription; used for event distribution
	Players             map[int]*Client          // players inside this cell atm
	Resources           []resource.Resource      // resources located in this cell
}

func GetGridCellKey(x int, y int) string {
	return fmt.Sprintf("%d:%d", x, y)
}

func (gm *GridManager) GetCellFromPos(clientPos shared.Vector) *GridCell {
	// get x and y from pos by concidering the grid cell size
	x := clientPos.X / GridCellSize
	y := clientPos.Y / GridCellSize

	a := gm.Grid[x]
	b := a[y]

	return &b
}

func NewCell(x int, y int) *GridCell {
	return &GridCell{
		Pos:                 shared.Vector{X: x, Y: y},
		Key:                 GetGridCellKey(x, y),
		PlayerSubscriptions: make(map[int]GridSubscription),
		Players:             make(map[int]*Client),
		Resources:           []resource.Resource{},
	}
}

func (cell *GridCell) subscribe(client *Client) {
	if subscription, ok := cell.PlayerSubscriptions[client.Id]; ok {
		fmt.Printf("Renewed sub x: %d y: %d\n", cell.Pos.X, cell.Pos.Y)
		// player has already subbed to this cell -> renew by updating the tick value
		subscription.SubTick = client.ZoneChangeTick
	} else {
		fmt.Printf("Added   sub x: %d y: %d\n", cell.Pos.X, cell.Pos.Y)
		cell.PlayerSubscriptions[client.Id] = GridSubscription{
			Player:  client,
			SubTick: client.ZoneChangeTick,
		}
		// if a client subs to a new cell provide him with players inside this cell
		for _, player := range cell.Players {
			if player.Id == client.Id {
				continue
			}
			client.send <- events.GetNewPlayerEvent(player.Id, player.Pos)
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

	// init cells around 0 0
	for x := -30; x <= 30; x++ {
		for y := -30; y <= 30; y++ {
			gm.add(x, y)
		}
	}

	return gm
}

func (gm *GridManager) clientMovedCell(newCellX int, newCellY int, client *Client) {
	cells := gm.getCells(newCellX, newCellY)

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
	for xOffset := -1; xOffset < 2; xOffset++ {
		for yOffset := -1; yOffset < 2; yOffset++ {
			cell := gm.Grid[x+xOffset][y+yOffset]
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
