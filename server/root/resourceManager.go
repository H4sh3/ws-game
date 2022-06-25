package root

import (
	"errors"
	"ws-game/resource"
)

type ResourceManager struct {
	resources   map[int]*resource.Resource
	idCnt       int
	GridManager *GridManager
	AddResource chan *resource.Resource
}

func AddResourceCoroRm(rM *ResourceManager) {
	for {
		r := <-rM.AddResource

		rM.resources[r.Id] = r

		rM.GridManager.AddResource <- r
	}
}

func NewResourceManager(gm *GridManager) *ResourceManager {
	rM := &ResourceManager{
		resources:   make(map[int]*resource.Resource),
		idCnt:       0,
		GridManager: gm,
		AddResource: make(chan *resource.Resource),
	}

	go AddResourceCoroRm(rM)

	return rM
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
	gm.resources[r.Id] = r
}

func (gm *ResourceManager) DeleteResource(id int) {
	gm.resources[id].Remove = true
	delete(gm.resources, id)
}

func (rm *ResourceManager) GetResourceId() int {
	rm.idCnt++
	return rm.idCnt
}
