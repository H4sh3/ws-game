package resource

import "ws-game/shared"

// resources can be different elements in the world
// we start with cooper and iron

type ResourceType string

const (
	Stone  ResourceType = "stone"
	Brick  ResourceType = "brick"
	Cooper ResourceType = "cooper"
	Iron   ResourceType = "iron"
	Gold   ResourceType = "gold"
)

type Hitpoints struct {
	Current int `json:"current"`
	Max     int `json:"max"`
}

type Resource struct {
	ResourceType ResourceType  `json:"resourceType"`
	Pos          shared.Vector `json:"pos"`
	Id           int           `json:"id"`
	Hitpoints    Hitpoints     `json:"hitpoints"`
}

func NewResource(resourceType ResourceType, pos shared.Vector, id int) *Resource {
	return &Resource{
		ResourceType: resourceType,
		Pos:          pos,
		Id:           id,
		Hitpoints: Hitpoints{
			Current: 100,
			Max:     100,
		},
	}
}
