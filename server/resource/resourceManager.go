package resource

import (
	"errors"
	"fmt"
)

type ResourceManager struct {
	resources map[int]Resource
	idCnt     int
}

func (gm *ResourceManager) GetResource(id int) (*Resource, error) {
	r, ok := gm.resources[id]
	if !ok {
		return nil, errors.New("resource does not exist")
	} else {
		return &r, nil
	}
}

func (gm *ResourceManager) SetResource(r Resource) {
	fmt.Println(r.Hitpoints)
	gm.resources[r.Id] = r
}

func (gm *ResourceManager) DeleteResource(id int) {
	delete(gm.resources, id)
}

func NewResourceManager() *ResourceManager {
	return &ResourceManager{
		resources: make(map[int]Resource),
		idCnt:     0,
	}
}

func (rm *ResourceManager) GetResourceId() int {
	rm.idCnt++
	return rm.idCnt
}
