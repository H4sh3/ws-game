package root

import (
	"fmt"
	"sync"
	"time"
	"ws-game/events"
	"ws-game/resource"
	"ws-game/shared"
)

const (
	CellUpdateRate = time.Millisecond * 50
)

type GridCell struct {
	Pos                    shared.Vector
	GridCellKey            string
	playerSubscriptions    map[int]GridSubscription // client id to subscription; used for event distribution
	wantsToSub             []*Client
	wantsToSubMutex        sync.Mutex
	wantsToUnSub           []*Client
	wantsToUnSubMutex      sync.Mutex
	playersToRemove        []int
	playersToRemoveMutex   sync.Mutex
	playersToAdd           []*Client
	playersToAddMutex      sync.Mutex
	Players                map[int]*Client            // players inside this cell atm
	Resources              map[int]*resource.Resource // resources located in this cell
	Broadcast              chan interface{}
	Subscribe              chan *Client
	Unsubscribe            chan int
	UpdateSubscriptions    chan bool
	CellMutex              sync.Mutex
	eventsToBroadcast      []interface{}
	eventsToBroadcastMutex sync.Mutex
	ticker                 time.Ticker
}

func NewCell(x int, y int) *GridCell {
	cell := &GridCell{
		Pos:                    shared.Vector{X: x, Y: y},
		GridCellKey:            getKey(x, y),
		playerSubscriptions:    make(map[int]GridSubscription),
		wantsToSub:             []*Client{},
		wantsToSubMutex:        sync.Mutex{},
		wantsToUnSub:           []*Client{},
		wantsToUnSubMutex:      sync.Mutex{},
		playersToRemove:        []int{},
		playersToRemoveMutex:   sync.Mutex{},
		playersToAdd:           []*Client{},
		playersToAddMutex:      sync.Mutex{},
		Players:                make(map[int]*Client),
		Resources:              make(map[int]*resource.Resource),
		Broadcast:              make(chan interface{}),
		Subscribe:              make(chan *Client),
		Unsubscribe:            make(chan int),
		UpdateSubscriptions:    make(chan bool),
		CellMutex:              sync.Mutex{},
		eventsToBroadcast:      []interface{}{},
		eventsToBroadcastMutex: sync.Mutex{},
	}
	t := time.NewTicker(CellUpdateRate)
	cell.ticker = *t

	go cell.CellCoro()
	//go cell.SubscribeCoro()
	//go cell.UnsubscribeCoro()
	//go cell.UpdateSubscriptionsCoro()
	return cell
}

func getKey(x int, y int) string {
	return fmt.Sprintf("%d#%d", x, y)
}

func (cell *GridCell) GetSubscriptions() []GridSubscription {
	subs := []GridSubscription{}
	cell.CellMutex.Lock()
	//	fmt.Printf("lock for subs %d %d\n", cell.Pos.X, cell.Pos.Y)
	for i := range cell.playerSubscriptions {
		subs = append(subs, cell.playerSubscriptions[i])
	}
	cell.CellMutex.Unlock()
	//	fmt.Printf("unlock for subs %d %d\n", cell.Pos.X, cell.Pos.Y)
	return subs
}

func (cell *GridCell) CellCoro() {
	for {
		select {
		// h.GridManager.drawGrid()
		/*
			Update Subs
		*/
		case <-cell.ticker.C:
			start := time.Now()
			// fmt.Println("update subs start")
			playersToRecieve := []*Client{}
			eventsToSend := []interface{}{}

			unsubscribePlayerIds := []int{}
			cellToUnsubFrom := []*GridCell{}

			cell.CellMutex.Lock()
			//			fmt.Printf("sub mutex lock %s\n", cell.GridCellKey)
			for _, sub := range cell.playerSubscriptions {

				isConnected := sub.Player.getConnected()

				if !isConnected {
					// Not connected? remove client from cells subs
					unsubscribePlayerIds = append(unsubscribePlayerIds, sub.Player.Id)
					cellToUnsubFrom = append(cellToUnsubFrom, cell)
					continue
				}

				diff := sub.Player.getZoneTick() - sub.SubTick
				if diff > 5 {
					// Unsubscribe connected players that moved a certain distance from the cell
					unsubscribePlayerIds = append(unsubscribePlayerIds, sub.Player.Id)
					cellToUnsubFrom = append(cellToUnsubFrom, cell)

					if isConnected {
						// Send remove grid event only to connected clients
						// this removes resources from frontend client to stay performant
						playersToRecieve = append(playersToRecieve, sub.Player)
						eventsToSend = append(eventsToSend, events.NewRemoveGridCellEvent(cell.GridCellKey))
					}
				}
			}
			cell.CellMutex.Unlock()
			//			fmt.Printf("sub mutex unlock %s\n", cell.GridCellKey)

			for i := range unsubscribePlayerIds {
				cellToUnsubFrom[i].UnsubscribeClient(unsubscribePlayerIds[i])
			}
			for i := range playersToRecieve {
				playersToRecieve[i].send <- eventsToSend[i]
			}

			// handle new subscriptions
			// if a client subs to a new cell provide him with players inside this cell
			cell.wantsToSubMutex.Lock()
			for _, client := range cell.wantsToSub {
				for _, player := range cell.Players {
					if player.Id == client.Id {
						continue
					}

					if client.Connected {
						cell.AddEventToBroadcast(events.GetNewPlayerEvent(player.Id, player.getPos()))
					}

					if player.Connected {
						cell.AddEventToBroadcast(events.GetNewPlayerEvent(client.Id, client.getPos()))
					}
				}
				if subscription, ok := cell.playerSubscriptions[client.Id]; ok {
					// player has already subbed to this cell -> renew by updating the tick value
					subscription.SubTick = client.getZoneTick()
					cell.playerSubscriptions[client.Id] = subscription
				} else {
					cell.playerSubscriptions[client.Id] = GridSubscription{
						Player:  client,
						SubTick: client.getZoneTick(),
					}

					// provide player with resources of this cell
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
			}
			// after all sub request have been processed, set to empty array
			cell.wantsToSub = []*Client{}
			cell.wantsToSubMutex.Unlock()

			// Remove players that are no longer in this cell
			cell.playersToRemoveMutex.Lock()
			for _, pId := range cell.playersToRemove {
				delete(cell.Players, pId)
			}
			cell.playersToRemoveMutex.Unlock()

			// Add players
			cell.playersToAddMutex.Lock()
			cell.CellMutex.Lock()
			for _, c := range cell.playersToAdd {
				cell.Players[c.Id] = c
				pos := c.getPos()
				event := events.GetNewPlayerEvent(c.Id, pos)
				cell.AddEventToBroadcast(event)
			}
			cell.playersToAdd = []*Client{}
			cell.playersToAddMutex.Unlock()
			cell.CellMutex.Unlock()

			// broadcast all events at once
			if len(cell.eventsToBroadcast) > 0 {
				eventsToBroadcast := cell.GetEventsToBroadcast()
				event := events.NewMultipleEvents(eventsToBroadcast)
				for _, sub := range cell.GetSubscriptions() {
					if sub.Player.getConnected() {
						sub.Player.send <- event
					}
				}
				// remove if all done
				cell.eventsToBroadcast = []interface{}{}
				fmt.Printf("%s loop took %dms\n", cell.GridCellKey, time.Since(start).Milliseconds())
			}
		/*
			Broadcast
		*/
		case event := <-cell.Broadcast:
			cell.AddEventToBroadcast(event)
		/*
			Subscribe
		*/
		case client := <-cell.Subscribe:
			cell.wantsToSubMutex.Lock()
			cell.wantsToSub = append(cell.wantsToSub, client)
			if len(cell.GetSubscriptions()) == 0 {
				cell.ticker.Reset(CellUpdateRate)
				fmt.Printf("started cell at %s\n", cell.GridCellKey)
			}
			cell.wantsToSubMutex.Unlock()
		}
	}

}

func (cell *GridCell) AddResource(r *resource.Resource) {
	cell.CellMutex.Lock()
	cell.Resources[r.Id] = r
	cell.CellMutex.Unlock()
}
func (cell *GridCell) AddPlayer(c *Client) {
	cell.playersToAddMutex.Lock()
	cell.playersToAdd = append(cell.playersToAdd, c)
	cell.playersToAddMutex.Unlock()
}

func (cell *GridCell) RemovePlayer(c *Client) {
	cell.playersToRemoveMutex.Lock()
	cell.playersToRemove = append(cell.playersToRemove, c.Id)
	cell.playersToRemoveMutex.Unlock()
}

func (cell *GridCell) RemoveResource(r *resource.Resource) {
	cell.CellMutex.Lock()
	delete(cell.Resources, r.Id)
	cell.CellMutex.Unlock()
}

func (cell *GridCell) isClientSubscribed(cId int) bool {
	cell.CellMutex.Lock()
	_, ok := cell.playerSubscriptions[cId]
	cell.CellMutex.Unlock()
	return ok
}

func (cell *GridCell) UnsubscribeClient(cId int) {
	cell.CellMutex.Lock()
	delete(cell.playerSubscriptions, cId)
	if len(cell.playerSubscriptions) == 0 {
		cell.ticker.Stop()
		fmt.Printf("stopped cell at %s\n", cell.GridCellKey)
	}
	cell.CellMutex.Unlock()
}

func (cell *GridCell) AddEventToBroadcast(event interface{}) {
	cell.eventsToBroadcastMutex.Lock()
	cell.eventsToBroadcast = append(cell.eventsToBroadcast, event)
	cell.eventsToBroadcastMutex.Unlock()
}

func (cell *GridCell) GetEventsToBroadcast() []interface{} {
	cell.eventsToBroadcastMutex.Lock()
	events := cell.eventsToBroadcast
	cell.eventsToBroadcastMutex.Unlock()
	return events
}
