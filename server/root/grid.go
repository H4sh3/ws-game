package root

import (
	"ws-game/resource"
)

type GridSubscription struct {
	Player  *Client
	SubTick int
}

func (sub *GridSubscription) expired() bool {
	return sub.Player.ZoneChangeTick-sub.SubTick > 10
}

type GridCell struct {
	Id                  int
	PlayerSubscriptions map[int]GridSubscription // client id to subscription; used for event distribution
	Resources           []resource.Resource      // resources located in this cell
}

func (cell *GridCell) subscribe(client *Client) {
	if subscription, ok := cell.PlayerSubscriptions[client.Id]; ok {
		// player has already subbed to this cell -> renew by updating the tick value
		subscription.SubTick = client.ZoneChangeTick
	} else {
		cell.PlayerSubscriptions[client.Id] = GridSubscription{
			Player:  client,
			SubTick: client.ZoneChangeTick,
		}
	}
}

type GridManager struct {
	Grid map[int]map[int]GridCell
	Hub  Hub
	Tick int
}

func (gm *GridManager) clientMovedCell(newCellX int, newCellY, clientId int) {
	cells := gm.getCells(newCellX, newCellY)
	client := gm.Hub.clients[clientId]

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
