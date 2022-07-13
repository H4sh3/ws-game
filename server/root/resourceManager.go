package root

import (
	"errors"
	"sync"
	"time"
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

func intInSlice(a int, list []int) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

func getRealResourcePos(gridCellPos shared.Vector, spawnPositions []shared.Vector, i int) shared.Vector {
	x := (gridCellPos.X * GridCellSize) + spawnPositions[i].X*SubCellSize
	y := (gridCellPos.Y * GridCellSize) + spawnPositions[i].Y*SubCellSize
	x += SubCellSize / 2
	y += SubCellSize / 2
	x += shared.RandIntInRange(-10, 10)
	y += shared.RandIntInRange(-10, 10)
	return shared.Vector{X: x, Y: y}
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

				numTrees := shared.RandIntInRange(20, 50)
				numStones := shared.RandIntInRange(5, 20)

				spawnPositions := []shared.Vector{}
				usedSpawnIndicies := []int{}

				for len(spawnPositions) < numStones+numTrees {
					subCellIndicie := shared.RandIntInRange(0, len(cell.SubCells)-1)
					subCell := cell.SubCells[subCellIndicie]
					if subCell.TerrainType != Water && subCell.TerrainType != ShallowWater && !intInSlice(subCellIndicie, usedSpawnIndicies) {
						spawnPositions = append(spawnPositions, subCell.Pos)
						usedSpawnIndicies = append(usedSpawnIndicies, subCellIndicie)
					}
				}

				newResources := make(map[int]resource.Resource)
				for i := 0; i < numStones; i++ {
					pos := getRealResourcePos(cell.Pos, spawnPositions, i)

					id := rM.GetResourceId()
					r := resource.NewResource(resource.Stone, pos, id, 100, true, 100, false, cell.GridCellKey)
					rM.resources[r.Id] = r
					newResources[r.Id] = *r
					cell.ResourcesMutex.Lock()
					cell.Resources[r.Id] = r
					cell.ResourcesMutex.Unlock()
				}

				// spawn trees
				for i := numStones; i < numTrees+numStones; i++ {
					pos := getRealResourcePos(cell.Pos, spawnPositions, i)

					id := rM.GetResourceId()
					r := resource.NewResource(resource.Tree, pos, id, 100, true, 100, false, cell.GridCellKey)
					rM.resources[r.Id] = r
					newResources[r.Id] = *r
					cell.Resources[r.Id] = r
				}

				cell.Broadcast <- NewResourcePositionsEvent(newResources)
			}
			// all new cells initialized
			rM.cellsToInit = []*GridCell{}

			rM.cellsToInitMutex.Unlock()
			rM.resourcesMutex.Unlock()
		}
	}
}

func (gm *ResourceManager) GetResource(id int) (*resource.Resource, error) {
	defer func() {
		gm.resourcesMutex.Unlock()
	}()

	gm.resourcesMutex.Lock()

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
	gm.resources[id].SetRemove(true)
	delete(gm.resources, id)
	gm.resourcesMutex.Unlock()
}

func (rm *ResourceManager) GetResourceId() int {
	rm.idCnt++
	return rm.idCnt
}
