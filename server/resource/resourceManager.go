package resource

import (
	"errors"
)

type ResourceManager struct {
	resources map[int]*Resource
	idCnt     int
}

func (gm *ResourceManager) GetResource(id int) (*Resource, error) {
	r := gm.resources[id]
	if r == nil {
		return r, errors.New("resource does not exist")
	} else {
		return r, nil
	}
}

func (gm *ResourceManager) SetResource(r *Resource) {
	gm.resources[r.Id] = r
}

func (gm *ResourceManager) DeleteResource(id int) {
	delete(gm.resources, id)
}

func NewResourceManager() *ResourceManager {
	return &ResourceManager{
		resources: make(map[int]*Resource),
		idCnt:     0,
	}
}

func (rm *ResourceManager) Add(r *Resource) {
	rm.resources[r.Id] = r
}

func (rm *ResourceManager) GetResourceId() int {
	rm.idCnt++
	return rm.idCnt
}
