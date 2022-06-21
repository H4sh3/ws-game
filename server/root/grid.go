package root

import (
	"fmt"
	"math"
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
		// player has already subbed to this cell -> renew by updating the tick value
		subscription.SubTick = client.ZoneChangeTick
	} else {
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

	n := 5
	c := 0
	// init cells around 0 0
	for x := -n; x <= n; x++ {
		for y := -n; y <= n; y++ {
			gm.add(x, y)
			c++
		}
	}

	return gm
}

func (gm *GridManager) clientMovedCell(newCellX int, newCellY int, client *Client) {
	cells := gm.getCells(newCellX, newCellY)

	// This counter is increased each zone change
	// When a client subs to a cell its current Tick is stored on the sub
	// If the tick value on the sub and the latest tick value of the client are to different we can asume the client is far aways and can be unsubbed from the cell
	client.ZoneChangeTick += 1

	for _, cell := range cells {
		cell.subscribe(client)
	}

	gm.drawGrid()

	// Todo: do this only every n-th ticks or somethign
	for x, col := range gm.Grid {
		for y, cell := range col {
			for i, sub := range cell.PlayerSubscriptions {
				diff := sub.Player.ZoneChangeTick - sub.SubTick
				if diff > 5 {
					delete(gm.Grid[x][y].PlayerSubscriptions, i)
				}
			}
		}
	}
}

func (gm *GridManager) getCells(x int, y int) []GridCell {
	neighbourCells := []GridCell{}
	area := 2
	for xOffset := -area; xOffset <= area; xOffset++ {
		for yOffset := -area; yOffset <= area; yOffset++ {
			xIdx := x + xOffset
			yIdx := y + yOffset
			col, ok := gm.Grid[xIdx]

			if !ok {
				gm.add(xIdx, yIdx)
				col = gm.Grid[xIdx]
			}

			cell, cellOk := col[yIdx]
			if !cellOk {
				gm.add(xIdx, yIdx)
				cell = col[yIdx]
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

func (gm *GridManager) drawGrid() {
	minY := 0 //int(math.Inf(1))
	maxY := int(math.Inf(-1))
	minX := 0 //int(math.Inf(1))
	maxX := int(math.Inf(-1))
	for x, col := range gm.Grid {
		if x < minX {
			minX = x
		}
		if x > maxX {
			maxX = x
		}
		for y, _ := range col {
			if y < minY {
				minY = y
			}
			if y > maxY {
				maxY = y
			}
		}
	}

	s := ""

	for y := minY - 1; y < maxY+2; y++ {
		for x := minX - 1; x < maxX+2; x++ {
			col, ok := gm.Grid[x]
			if !ok {
				s += " "
			} else {
				_, ok = col[y]
				if !ok {
					s += " "
				} else {
					if len(col[y].PlayerSubscriptions) > 0 {
						s += "+"
					} else {
						s += "-"
					}
				}
			}

		}
		s += "\n"
	}
	fmt.Println(s)
}
