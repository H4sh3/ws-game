package root

import (
	"fmt"
	"sync"
	"ws-game/events"
	"ws-game/resource"
	"ws-game/shared"
)

type GridCell struct {
	Pos                 shared.Vector
	GridCellKey         string
	PlayerSubscriptions map[int]GridSubscription   // client id to subscription; used for event distribution
	Players             map[int]*Client            // players inside this cell atm
	Resources           map[int]*resource.Resource // resources located in this cell
	mutex               *sync.Mutex
}

func NewCell(x int, y int) *GridCell {
	return &GridCell{
		Pos:                 shared.Vector{X: x, Y: y},
		GridCellKey:         getKey(x, y),
		PlayerSubscriptions: make(map[int]GridSubscription),
		Players:             make(map[int]*Client),
		Resources:           make(map[int]*resource.Resource),
		mutex:               &sync.Mutex{},
	}
}

func getKey(x int, y int) string {
	return fmt.Sprintf("%d#%d", x, y)
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

func (cell *GridCell) AddResource(r *resource.Resource) {
	cell.mutex.Lock()
	cell.Resources[r.Id] = r
	cell.mutex.Unlock()
}

func (cell *GridCell) Subscribe(client *Client) {
	// if a client subs to a new cell provide him with players inside this cell
	for _, player := range cell.Players {
		if player.Id == client.Id {
			continue
		}

		if client.Connected {
			client.send <- events.GetNewPlayerEvent(player.Id, player.Pos)
		}
	}

	if subscription, ok := cell.PlayerSubscriptions[client.Id]; ok {
		// player has already subbed to this cell -> renew by updating the tick value
		subscription.SubTick = client.ZoneChangeTick
		cell.PlayerSubscriptions[client.Id] = subscription
	} else {
		cell.PlayerSubscriptions[client.Id] = GridSubscription{
			Player:  client,
			SubTick: client.ZoneChangeTick,
		}

		// provide player with resources
		if len(cell.Resources) > 0 {
			cell.mutex.Lock()
			resources := make(map[int]resource.Resource)
			for idx, r := range cell.Resources {
				if r.Remove {
					delete(cell.Resources, idx)
				} else {
					resources[r.Id] = *r
				}

			}
			cell.mutex.Unlock()

			if client.Connected {
				client.send <- events.NewResourcePositionsEvent(resources)
			}
		}
	}
}
