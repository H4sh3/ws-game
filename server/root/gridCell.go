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
	playerSubscriptions map[int]GridSubscription   // client id to subscription; used for event distribution
	Players             map[int]*Client            // players inside this cell atm
	Resources           map[int]*resource.Resource // resources located in this cell
	Broadcast           chan interface{}
	Subscribe           chan *Client
	Unsubscribe         chan *Client
	UpdateSubscriptions chan bool
	Mutex               sync.Mutex
}

func NewCell(x int, y int) *GridCell {
	cell := &GridCell{
		Pos:                 shared.Vector{X: x, Y: y},
		GridCellKey:         getKey(x, y),
		playerSubscriptions: make(map[int]GridSubscription),
		Players:             make(map[int]*Client),
		Resources:           make(map[int]*resource.Resource),
		Broadcast:           make(chan interface{}),
		Subscribe:           make(chan *Client),
		Unsubscribe:         make(chan *Client),
		UpdateSubscriptions: make(chan bool),
		Mutex:               sync.Mutex{},
	}
	go cell.BroadcastCoro()
	go cell.SubscribeCoro()
	go cell.UnsubscribeCoro()
	return cell
}

func getKey(x int, y int) string {
	return fmt.Sprintf("%d#%d", x, y)
}

func (cell *GridCell) UpdateSubscriptionsCoro() {
	for {
		update := <-cell.UpdateSubscriptions
		if !update {
			return
		}
		cell.Mutex.Lock()
		for _, sub := range cell.playerSubscriptions {
			diff := sub.Player.getZoneTick() - sub.SubTick

			if !sub.Player.Connected {
				cell.Unsubscribe <- sub.Player
			}
			// Unsubscribe connected players that moved a certain distance from the cell
			if sub.Player.Connected && diff > 5 {
				cell.Unsubscribe <- sub.Player
				sub.Player.send <- events.NewRemoveGridCellEvent(cell.GridCellKey)
			}
		}
		cell.Mutex.Unlock()
	}
}

func (cell *GridCell) BroadcastCoro() {
	for {
		data := <-cell.Broadcast

		cell.Mutex.Lock()
		for _, sub := range cell.playerSubscriptions {
			if sub.Player.Connected {
				sub.Player.send <- data
			} else {
				delete(cell.playerSubscriptions, sub.Player.Id)
			}
		}
		cell.Mutex.Unlock()
	}
}

func (cell *GridCell) AddResource(r *resource.Resource) {
	cell.Resources[r.Id] = r
}
func (cell *GridCell) UnsubscribeCoro() {
	for {
		client := <-cell.Unsubscribe

		cell.Mutex.Lock()
		delete(cell.playerSubscriptions, client.Id)
		cell.Mutex.Unlock()
	}
}

func (cell *GridCell) AddPlayer(c *Client) {
	cell.Mutex.Lock()
	cell.Players[c.Id] = c
	cell.Mutex.Unlock()
	cell.Broadcast <- events.GetNewPlayerEvent(c.Id, c.getPos())
}

func (cell *GridCell) RemovePlayer(c *Client) {
	cell.Mutex.Lock()
	delete(cell.Players, c.Id)
	cell.Mutex.Unlock()
}

func (cell *GridCell) RemoveResource(r *resource.Resource) {
	cell.Mutex.Lock()
	delete(cell.Resources, r.Id)
	cell.Mutex.Unlock()
}

func (cell *GridCell) SubscribeCoro() {
	for {
		client := <-cell.Subscribe
		cell.Mutex.Lock()

		// if a client subs to a new cell provide him with players inside this cell
		for _, player := range cell.Players {
			if player.Id == client.Id {
				continue
			}

			if client.Connected {
				client.send <- events.GetNewPlayerEvent(player.Id, player.Pos)
			}

			if player.Connected {
				player.send <- events.GetNewPlayerEvent(client.Id, client.getPos())
			}
		}

		if subscription, ok := cell.playerSubscriptions[client.Id]; ok {
			// player has already subbed to this cell -> renew by updating the tick value
			subscription.SubTick = client.getZoneTick()
			cell.playerSubscriptions[client.Id] = subscription
		} else {
			cell.playerSubscriptions[client.Id] = GridSubscription{
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

				if client.Connected {
					client.send <- events.NewResourcePositionsEvent(resources)
				}
			}
		}

		cell.Mutex.Unlock()
	}
}
