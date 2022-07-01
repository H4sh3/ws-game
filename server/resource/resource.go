package resource

import "ws-game/shared"

// resources can be different elements in the world
// we start with cooper and iron

type ResourceType string

const (
	Stone     ResourceType = "stone"
	Brick     ResourceType = "brick"
	Tree      ResourceType = "tree"
	Log       ResourceType = "log"
	Blockade  ResourceType = "blockade"
	IronOre   ResourceType = "ironOre"
	IronIngot ResourceType = "ironIngot"
	Gold      ResourceType = "gold"
	Cooper    ResourceType = "cooper"
)

type Hitpoints struct {
	Current int `json:"current"`
	Max     int `json:"max"`
}

type Resource struct {
	ResourceType ResourceType  `json:"resourceType"`
	Pos          shared.Vector `json:"pos"`
	Id           int           `json:"id"`
	Quantity     int           `json:"quantity"`
	Hitpoints    Hitpoints     `json:"hitpoints"`
	IsSolid      bool          `json:"isSolid"`
	IsLootable   bool          `json:"isLootable"`
	GridCellKey  string        `json:"gridCellKey"`
	Remove       bool
}

func NewResource(resourceType ResourceType, pos shared.Vector, id int, quantity int, isSolid bool, hitpoints int, isLootable bool, gridCellKey string) *Resource {
	return &Resource{
		ResourceType: resourceType,
		Pos:          pos,
		Id:           id,
		Quantity:     quantity,
		Hitpoints: Hitpoints{
			Current: hitpoints,
			Max:     hitpoints,
		},
		IsSolid:     isSolid,
		IsLootable:  isLootable,
		GridCellKey: gridCellKey,
		Remove:      false,
	}
}
