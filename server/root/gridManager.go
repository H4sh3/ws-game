package root

import (
	"fmt"
	"math"
	"sync"
	"ws-game/resource"
	"ws-game/shared"
)

type GridSubscription struct {
	Player  *Client
	SubTick int
}

type GridManager struct {
	Grid                 map[int]map[int]*GridCell
	newCellChannel       chan *GridCell
	UpdateClientPosition chan *Client
	AddResource          chan *resource.Resource
	gridMutex            sync.RWMutex
}

func NewGridManager(newCellChannel chan *GridCell) *GridManager {
	gm := &GridManager{
		Grid:                 make(map[int]map[int]*GridCell),
		newCellChannel:       newCellChannel,
		UpdateClientPosition: make(chan *Client),
		AddResource:          make(chan *resource.Resource),
		gridMutex:            sync.RWMutex{},
	}

	go GridManagerCoro(gm)

	return gm
}

func GridManagerCoro(gm *GridManager) {
	for {
		select {
		case r := <-gm.AddResource:
			cell := gm.GetCellFromPos(r.Pos)
			cell.Resources[r.Id] = r

			newResources := make(map[int]resource.Resource)
			newResources[r.Id] = *r
			cell.Broadcast <- NewResourcePositionsEvent(newResources)

		case c := <-gm.UpdateClientPosition:
			// check if cell changed
			cPos := c.getPos()
			newX := cPos.X / GridCellSize
			newY := cPos.Y / GridCellSize

			gridCell := gm.GetCellFromPos(cPos)
			gridCell.Broadcast <- NewPlayerTargetPositionEvent(cPos, c.Id)

			clientCell := c.getGridCell()
			if newX != clientCell.Pos.X || newY != clientCell.Pos.Y {
				gm.clientMovedCell(clientCell, gridCell, c)
			}
		}
	}
}
func (gm *GridManager) GetCellFromPos(clientPos shared.Vector) *GridCell {
	// get x and y from pos by concidering the grid cell size
	x := clientPos.X / GridCellSize
	y := clientPos.Y / GridCellSize

	return gm.GetCell(x, y)
}

func (gm *GridManager) GetCell(x int, y int) *GridCell {
	gm.gridMutex.Lock()
	//fmt.Println("grid 1 locked")

	col, colOk := gm.Grid[x]

	if !colOk {
		cell := gm.add(x, y)
		gm.gridMutex.Unlock()
		//fmt.Println("grid 1 unlocked")
		return cell
	}
	_, cellOk := col[y]
	if !cellOk {
		cell := gm.add(x, y)
		gm.gridMutex.Unlock()
		//fmt.Println("grid 1 unlocked")
		return cell
	}
	cell := gm.Grid[x][y]
	gm.gridMutex.Unlock()
	//fmt.Println("grid 1 unlocked")
	return cell

}

func (gm *GridManager) clientMovedCell(oldCell *GridCell, newCell *GridCell, c *Client) {
	// remove client from old cell
	oldCell.RemovePlayer(c)

	// set client to new cell
	c.setGridCell(newCell)
	newCell.AddPlayer(c)

	// This counter is increased each zone change
	// When a client subs to a cell its current Tick is stored on the sub
	// If the tick value on the sub and the latest tick value of the client are to different we can asume the client is far aways and can be unsubbed from the cell
	c.IncrementZoneTick()

	// Subscribe to the new cell and its surrounding cells
	// # # #
	// # x #	x -> is current cell
	// # # #
	cells := gm.getCells(newCell.Pos.X, newCell.Pos.Y)
	for _, cell := range cells {
		cell.Subscribe <- c
	}

	// Notify clients to remove player if he moved to a cell they are not subscribed to
	for _, oldCellSub := range oldCell.GetSubscriptions() {
		if !newCell.isClientSubscribed(oldCellSub.Player.Id) {
			// notify to delete player clientside
			if oldCellSub.Player.Connected {
				oldCellSub.Player.send <- NewRemovePlayerEvent(c.Id)
			}
		}
	}
}

// cells provided to a client entering a new cell
func (gm *GridManager) getCells(x int, y int) []*GridCell {
	neighbourCells := []*GridCell{}
	area := 2
	for xOffset := -area; xOffset <= area; xOffset++ {
		for yOffset := -area; yOffset <= area; yOffset++ {
			xIdx := x + xOffset
			yIdx := y + yOffset

			fmt.Printf("getting cell %d %d\n", xIdx, yIdx)

			cell := gm.GetCell(xIdx, yIdx)

			neighbourCells = append(neighbourCells, cell)
		}
	}
	return neighbourCells
}

func (gm *GridManager) add(x int, y int) *GridCell {
	cell := NewCell(x, y)

	gm.newCellChannel <- cell

	col, ok := gm.Grid[x]

	if ok {
		// col exists set cell
		col[y] = cell
	} else {
		// add col and add cell
		gm.Grid[x] = make(map[int]*GridCell)
		gm.Grid[x][y] = cell
	}

	// gm.InitCellChannel <- cell
	return cell
}

func (gm *GridManager) GridMap() string {
	gm.gridMutex.Lock()
	fmt.Println("draw grid lock")
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
				_, ok := col[y]
				if !ok {
					s += " "
				} else {
					//cell := col[y]
					s += "+"
					//					if len(cell.GetSubscriptions()) > 0 {
					//					} else {
					//						s += "-"
					//					}
				}
			}

		}
		s += "\n"
	}
	gm.gridMutex.Unlock()
	return s
}
