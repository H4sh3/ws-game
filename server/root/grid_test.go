package root

import (
	"fmt"
	"testing"
)

func TestGridManager(t *testing.T) {
	manager := GridManager{
		Grid: make(map[int]map[int]GridCell),
	}

	n := 0
	for x := -1; x <= 1; x++ {
		for y := -1; y <= 1; y++ {
			manager.add(x, y)
			n++
		}
	}

	neighbours := manager.getCells(0, 0)
	fmt.Println(neighbours)
}
