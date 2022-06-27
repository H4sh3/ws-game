package root

import (
	"errors"
	"sync"
	"time"
	"ws-game/events"
	"ws-game/resource"
	"ws-game/shared"
)

type ResourceManager struct {
	resources        map[int]*resource.Resource
	resourcesMutex   sync.Mutex
	idCnt            int
	GridManager      *GridManager
	AddResource      chan *resource.Resource
	initCellChannel  chan *GridCell
	cellsToInit      []*GridCell
	cellsToInitMutex sync.Mutex
}

func NewResourceManager(gm *GridManager, initCellChannel chan *GridCell) *ResourceManager {
	rM := &ResourceManager{
		resources:        make(map[int]*resource.Resource),
		resourcesMutex:   sync.Mutex{},
		idCnt:            0,
		GridManager:      gm,
		AddResource:      make(chan *resource.Resource),
		initCellChannel:  initCellChannel,
		cellsToInit:      []*GridCell{},
		cellsToInitMutex: sync.Mutex{},
	}

	go ResourcemanagerCoro(rM)

	return rM
}

func ResourcemanagerCoro(rM *ResourceManager) {
	t := time.NewTicker(time.Second)
	for {
		select {
		case r := <-rM.AddResource:
			rM.resourcesMutex.Lock()
			rM.resources[r.Id] = r
			rM.resourcesMutex.Unlock()
			rM.GridManager.AddResource <- r
		case cell := <-rM.initCellChannel:
			rM.cellsToInitMutex.Lock()
			rM.cellsToInit = append(rM.cellsToInit, cell)
			rM.cellsToInitMutex.Unlock()
		case <-t.C:
			rM.cellsToInitMutex.Lock()
			rM.resourcesMutex.Lock()
			for _, cell := range rM.cellsToInit {
				newResources := make(map[int]resource.Resource)
				oX := shared.RandIntInRange(-25, 25)
				oY := shared.RandIntInRange(-25, 25)
				for i := 0; i < shared.RandIntInRange(1, 50); i++ {
					x := (cell.Pos.X * GridCellSize) - GridCellSize/2 + shared.RandIntInRange(-250, 250) + oX
					y := (cell.Pos.Y * GridCellSize) - GridCellSize/2 + shared.RandIntInRange(-250, 250) + oY
					pos := shared.Vector{X: x, Y: y}
					id := rM.GetResourceId()
					r := resource.NewResource(resource.Stone, pos, id, 100, true, 100, false, cell.GridCellKey)
					rM.resources[r.Id] = r
					newResources[r.Id] = *r
					cell.Resources[r.Id] = r
				}

				// spawn trees
				for n := 0; n < shared.RandIntInRange(2, 50); n++ {
					x := (cell.Pos.X * GridCellSize) + shared.RandIntInRange(0, GridCellSize)
					y := (cell.Pos.Y * GridCellSize) + shared.RandIntInRange(0, GridCellSize)
					pos := shared.Vector{X: x, Y: y}
					id := rM.GetResourceId()
					r := resource.NewResource(resource.Tree, pos, id, 100, true, 100, false, cell.GridCellKey)
					rM.resources[r.Id] = r
					newResources[r.Id] = *r
					cell.Resources[r.Id] = r
				}

				cell.Broadcast <- events.NewResourcePositionsEvent(newResources)
			}
			// all new cells initialized
			rM.cellsToInit = []*GridCell{}
			rM.cellsToInitMutex.Unlock()
			rM.resourcesMutex.Unlock()
		}
	}
}

func (gm *ResourceManager) GetResource(id int) (*resource.Resource, error) {
	r, ok := gm.resources[id]
	if !ok {
		return nil, errors.New("resource does not exist")
	} else {
		return r, nil
	}
}

func (gm *ResourceManager) SetResource(r *resource.Resource) {
	gm.resourcesMutex.Lock()
	gm.resources[r.Id] = r
	gm.resourcesMutex.Unlock()
}

func (gm *ResourceManager) DeleteResource(id int) {
	gm.resourcesMutex.Lock()
	gm.resources[id].Remove = true
	delete(gm.resources, id)
	gm.resourcesMutex.Unlock()
}

func (rm *ResourceManager) GetResourceId() int {
	rm.idCnt++
	return rm.idCnt
}
