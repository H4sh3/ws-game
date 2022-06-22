package root

import (
	"fmt"
	"testing"
	"ws-game/shared"
)

func consumer(c chan shared.Vector) {
	for {
		x := <-c
		fmt.Println(x)
	}
}

func TestGridManager(t *testing.T) {

	channel := make(chan shared.Vector)
	go consumer(channel)
	gm := NewGridManager(&channel)
	pos := gm.GetCellFromPos(shared.Vector{X: 0, Y: 0})
	fmt.Println(pos)

	t.Fail()
}
