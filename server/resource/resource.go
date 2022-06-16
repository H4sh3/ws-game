package resource

import "ws-game/shared"

// resources can be different elements in the world
// we start with cooper and iron

type ResourceType string

const (
	Cooper ResourceType = "cooper"
	Iron   ResourceType = "iron"
	Gold   ResourceType = "gold"
)

type Capacity struct {
	Current int `json:"current"`
	Max     int `json:"max"`
}

type Resource struct {
	ResourceType ResourceType  `json:"resourceType"`
	Pos          shared.Vector `json:"pos"`
	Capacity     Capacity      `json:"capacity"`
}

func NewResource(resourceType ResourceType, pos shared.Vector) *Resource {
	return &Resource{
		ResourceType: resourceType,
		Pos:          pos,
		Capacity: Capacity{
			Current: 100,
			Max:     100,
		},
	}
}
