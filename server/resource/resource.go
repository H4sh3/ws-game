package resource

import "ws-game/shared"

// resources can be different elements in the world
// we start with cooper and iron

type ResourceType string

const (
	Stone        ResourceType = "stone"
	Brick        ResourceType = "brick"
	Tree         ResourceType = "tree"
	Log          ResourceType = "log"
	Blockade     ResourceType = "blockade"
	WoodBlockade ResourceType = "woodBlockade"
	IronOre      ResourceType = "ironOre"
	IronIngot    ResourceType = "ironIngot"
	Gold         ResourceType = "gold"
	Cooper       ResourceType = "cooper"
)

type ResourceMin struct {
	ResourceType ResourceType `json:"resourceType"`
	Quantity     int          `json:"quantity"`
}

type Resource struct {
	ResourceType ResourceType     `json:"resourceType"`
	Pos          shared.Vector    `json:"pos"`
	Id           int              `json:"id"`
	Quantity     int              `json:"quantity"`
	Hitpoints    shared.Hitpoints `json:"hitpoints"`
	IsSolid      bool             `json:"isSolid"`
	IsLootable   bool             `json:"isLootable"`
	GridCellKey  string           `json:"gridCellKey"`
	remove       bool
}

func (r *Resource) GetRemove() bool {
	return r.remove
}

func (r *Resource) SetRemove(value bool) {
	r.remove = value
}

func NewResource(resourceType ResourceType, pos shared.Vector, id int, quantity int, isSolid bool, hitpoints int, isLootable bool, gridCellKey string) *Resource {
	return &Resource{
		ResourceType: resourceType,
		Pos:          pos,
		Id:           id,
		Quantity:     quantity,
		Hitpoints: shared.Hitpoints{
			Current: hitpoints,
			Max:     hitpoints,
		},
		IsSolid:     false, //isSolid,
		IsLootable:  isLootable,
		GridCellKey: gridCellKey,
		remove:      false,
	}
}
