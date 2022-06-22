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

type GridManager struct {
	Grid map[int]map[int]*GridCell
	Hub  Hub
}

func NewGridManager() *GridManager {

	gm := GridManager{
		Grid: make(map[int]map[int]*GridCell),
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

	return &gm
}

func (gm *GridManager) AddResource(x int, y int, r *resource.Resource) {
	gm.Grid[x][y].Resources[r.Id] = r
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

	return cell
}

func (gm *GridManager) clientMovedCell(oldCell GridCell, newCell GridCell, c *Client) {

	// remove client from old cell
	delete(oldCell.Players, c.Id)

	// set client to new cell
	c.GridCell = &newCell
	newCell.Players[c.Id] = c

	// This counter is increased each zone change
	// When a client subs to a cell its current Tick is stored on the sub
	// If the tick value on the sub and the latest tick value of the client are to different we can asume the client is far aways and can be unsubbed from the cell
	c.ZoneChangeTick += 1

	// Subscribe to the new cell and its surrounding cells
	// # # #
	// # x #	x -> is current cell
	// # # #
	cells := gm.getCells(newCell.Pos.X, newCell.Pos.Y)
	for _, cell := range cells {
		cell.Subscribe(c)
	}

	// Todo: do this only every n-th ticks or somethign
	// Unsibscribe players from cells they haven't been to in a while
	for x, col := range gm.Grid {
		for y, cell := range col {
			for _, sub := range cell.PlayerSubscriptions {
				diff := sub.Player.ZoneChangeTick - sub.SubTick
				if !sub.Player.Connected || diff > 5 {
					delete(gm.Grid[x][y].PlayerSubscriptions, sub.Player.Id)
				}
			}
		}
	}

	// Notify clients to remove player if he moved to a cell they are not subscribed to
	for _, oldCellSub := range oldCell.PlayerSubscriptions {
		subbedToNewCell := false
		for _, newCellSub := range newCell.PlayerSubscriptions {
			if oldCellSub.Player.Id == newCellSub.Player.Id {
				subbedToNewCell = true
				break
			}
		}
		if !subbedToNewCell {
			// notify to delete player clientside
			oldCellSub.Player.send <- events.NewRemovePlayerEvent(c.Id)
		}
	}

	// Todo: Add debug flag for this?
	gm.drawGrid()
}

// cells provided to a client entering a new cell
func (gm *GridManager) getCells(x int, y int) []*GridCell {
	neighbourCells := []*GridCell{}
	area := 1
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
	cell := NewCell(x, y)
	col, ok := gm.Grid[x]

	if ok {
		// col exists set cell
		col[y] = cell
	} else {
		// add col and add cell
		gm.Grid[x] = make(map[int]*GridCell)
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
		for y := range col {
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
