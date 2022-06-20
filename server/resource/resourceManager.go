package resource

type ResourceManager struct {
	Resources map[int]*Resource
	idCnt     int
}

func NewResourceManager() *ResourceManager {
	return &ResourceManager{
		Resources: make(map[int]*Resource),
		idCnt:     0,
	}
}

func (rm *ResourceManager) Add(r *Resource) {
	rm.Resources[r.Id] = r
}

func (rm *ResourceManager) GetResourceId() int {
	rm.idCnt++
	return rm.idCnt
}
