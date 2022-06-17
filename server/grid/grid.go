package grid

type GridCell struct {
	Id int
}

type GridManager struct {
	Grid map[int]map[int]GridCell
}

func (gm *GridManager) getNeighbours(x int, y int) []GridCell {
	neighbourCells := []GridCell{}
	for xOffset := -1; xOffset < 2; xOffset++ {
		for yOffset := -1; yOffset < 2; yOffset++ {
			cell := gm.Grid[xOffset][yOffset]
			neighbourCells = append(neighbourCells, cell)
		}
	}
	return neighbourCells
}

func (gm *GridManager) add(x int, y int, cell GridCell) {
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
