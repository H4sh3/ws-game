package root

import (
	"encoding/json"
	"ws-game/item"
	"ws-game/resource"
	"ws-game/shared"
)

type EventType int

const (
	NEW_USER_EVENT               EventType = 0
	USER_INIT_EVENT              EventType = 1
	USER_MOVE_EVENT              EventType = 2
	KEYBOARD_EVENT               EventType = 3
	PLAYER_TARGET_POSITION_EVENT EventType = 4
	RESOURCE_POSITIONS_EVENT     EventType = 5
	REMOVE_PLAYER_EVENT          EventType = 6
	HIT_RESOURCE_EVENT           EventType = 7
	UPDATE_RESOURCE_EVENT        EventType = 8
	LOOT_RESOURCE_EVENT          EventType = 9
	PLAYER_PLACED_RESOURCE_EVENT EventType = 10
	LOAD_INVENTORY_EVENT         EventType = 11
	UPDATE_INVENTORY_EVENT       EventType = 12
	REMOVE_GRID_CELL             EventType = 13
	MULTIPLE_EVENTS              EventType = 14
	LOGIN_PLAYER_EVENT           EventType = 15
	CELL_DATA_EVENT              EventType = 16
	NPC_LIST_EVENT               EventType = 17
	NPC_TARGET_POSITION_EVENT    EventType = 18
	HIT_NPC_EVENT                EventType = 19
	UPDATE_NPC_EVENT             EventType = 20
	UPDATE_PLAYER_EVENT          EventType = 21
	NPC_ATTACK_ANIM_EVENT        EventType = 22
	ITEM_POSITIONS_EVENT         EventType = 23
	PLAYER_CLICKED_ITEM_EVENT    EventType = 24
	REMOVE_ITEM_EVENT            EventType = 25
	UPDATE_INVENTORY_ITEM_EVENT  EventType = 26
)

const (
	PLAYER_LOGIN_EVENT EventType = 15
)

type NewPlayerEvent struct {
	EventType EventType        `json:"eventType"`
	Id        int              `json:"id"`
	Pos       shared.Vector    `json:"pos"`
	Hitpoints shared.Hitpoints `json:"hitpoints"`
}

func GetNewPlayerEvent(id int, pos shared.Vector, hitpoints shared.Hitpoints) interface{} {
	return &NewPlayerEvent{EventType: NEW_USER_EVENT, Id: id, Pos: pos, Hitpoints: hitpoints}
}

type GameConfig struct {
	GridCellSize   int `json:"gridCellSize"`
	SubCells       int `json:"subCells"`
	PlayerStepSize int `json:"playerStepSize"`
	SubCellSize    int `json:"subCellSize"`
}

type UserInitEvent struct {
	EventType  EventType        `json:"eventType"`
	Id         int              `json:"id"`
	Pos        shared.Vector    `json:"pos"`
	Hitpoints  shared.Hitpoints `json:"hitpoints"`
	UUID       string           `json:"uuid"`
	GameConfig GameConfig       `json:"gameConfig"`
}

func NewUserInitEvent(id int, pos shared.Vector, hitpoints shared.Hitpoints, uuid string, config GameConfig) interface{} {
	return &UserInitEvent{
		EventType:  USER_INIT_EVENT,
		Id:         id,
		Pos:        pos,
		Hitpoints:  hitpoints,
		UUID:       uuid,
		GameConfig: config,
	}
}

type PlayerTargetPositionEvent struct {
	EventType EventType     `json:"eventType"`
	Id        int           `json:"id"`
	Pos       shared.Vector `json:"pos"`
	Force     bool          `json:"force"`
}

func NewPlayerTargetPositionEvent(v shared.Vector, id int, force bool) interface{} {
	return &PlayerTargetPositionEvent{EventType: PLAYER_TARGET_POSITION_EVENT, Pos: v, Id: id, Force: force}
}

type ResourcePositionsEvent struct {
	EventType EventType           `json:"eventType"`
	Resources []resource.Resource `json:"resources"`
}

func NewResourcePositionsEvent(resources map[int]resource.Resource) interface{} {

	v := make([]resource.Resource, 0, len(resources))

	for _, value := range resources {
		v = append(v, value)
	}

	return &ResourcePositionsEvent{EventType: RESOURCE_POSITIONS_EVENT, Resources: v}
}

type ItemPositionsEvent struct {
	EventType   EventType   `json:"eventType"`
	GridCellKey string      `json:"gridCellKey"`
	Items       []item.Item `json:"items"`
}

func NewItemPositionsEvent(items []item.Item, gridCellKey string) interface{} {

	return &ItemPositionsEvent{
		EventType:   ITEM_POSITIONS_EVENT,
		GridCellKey: gridCellKey,
		Items:       items,
	}
}

type RemoveItemEvent struct {
	EventType EventType `json:"eventType"`
	UUID      string    `json:"uuid"`
}

func NewRemoveItemEvent(uuid string) RemoveItemEvent {
	return RemoveItemEvent{EventType: REMOVE_ITEM_EVENT, UUID: uuid}
}

type NpcListEvent struct {
	EventType   EventType `json:"eventType"`
	GridCellKey string    `json:"gridCellKey"`
	NpcList     []Npc     `json:"npcList"`
}

func NewNpcListEvent(gridCellKey string, npcList []Npc) interface{} {
	return NpcListEvent{
		EventType:   NPC_LIST_EVENT,
		GridCellKey: gridCellKey,
		NpcList:     npcList,
	}
}

type RemovePlayerEvent struct {
	EventType EventType `json:"eventType"`
	Id        int       `json:"id"`
}

func NewRemovePlayerEvent(id int) interface{} {
	return &RemovePlayerEvent{EventType: REMOVE_PLAYER_EVENT, Id: id}
}

type LoadInventoryEvent struct {
	EventType EventType              `json:"eventType"`
	Resources []resource.ResourceMin `json:"resources"`
	Items     []item.Item            `json:"items"`
}

func NewLoadInventoryEvent(inventory map[resource.ResourceType]resource.Resource, items []item.Item) interface{} {

	resources := []resource.ResourceMin{}

	for _, entry := range inventory {
		resources = append(resources, resource.ResourceMin{
			Quantity:     entry.Quantity,
			ResourceType: entry.ResourceType,
		})
	}

	return &LoadInventoryEvent{
		EventType: LOAD_INVENTORY_EVENT,
		Resources: resources,
		Items:     items,
	}
}

type UpdateInventoryEvent struct {
	EventType EventType            `json:"eventType"`
	Resource  resource.ResourceMin `json:"resource"`
	Remove    bool                 `json:"remove"`
}

func NewUpdateInventoryEvent(r resource.ResourceMin, remove bool) interface{} {
	return &UpdateInventoryEvent{
		EventType: UPDATE_INVENTORY_EVENT,
		Resource:  r,
		Remove:    remove,
	}
}

type UpdateInventoryItemEvent struct {
	EventType EventType `json:"eventType"`
	Item      item.Item `json:"item"`
	Remove    bool      `json:"remove"`
}

func NewUpdateInventoryItemEvent(item item.Item, remove bool) interface{} {
	return &UpdateInventoryItemEvent{
		EventType: UPDATE_INVENTORY_ITEM_EVENT,
		Item:      item,
		Remove:    remove,
	}
}

type UpdateResourceEvent struct {
	EventType   EventType        `json:"eventType"`
	GridCellKey string           `json:"gridCellKey"`
	Id          int              `json:"id"`
	Hitpoints   shared.Hitpoints `json:"hitpoints"`
	Remove      bool             `json:"remove"`
	Damage      int              `json:"damage"`
}

func NewUpdateResourceEvent(id int, currentHp int, maxHp int, remove bool, gridCellKey string, damage int) interface{} {
	hitpoints := shared.Hitpoints{Current: currentHp, Max: maxHp}
	return &UpdateResourceEvent{EventType: UPDATE_RESOURCE_EVENT, Id: id, Remove: remove, Hitpoints: hitpoints, GridCellKey: gridCellKey, Damage: damage}
}

type RemoveGridCellEvent struct {
	EventType   EventType `json:"eventType"`
	GridCellKey string    `json:"gridCellKey"`
}

func NewRemoveGridCellEvent(gridCellKey string) interface{} {
	return &RemoveGridCellEvent{EventType: REMOVE_GRID_CELL, GridCellKey: gridCellKey}
}

type CellDataEvent struct {
	EventType     EventType     `json:"eventType"`
	GridCellKey   string        `json:"gridCellKey"`
	Pos           shared.Vector `json:"pos"`
	SubCells      []SubCell     `json:"subCells"`
	SubCellBase64 string        `json:"subCellBase64"`
}

func NewCellDataEvent(gridCellKey string, subCells []SubCell, pos shared.Vector, subCellBase64 string) interface{} {
	return &CellDataEvent{
		EventType:     CELL_DATA_EVENT,
		GridCellKey:   gridCellKey,
		SubCells:      subCells,
		Pos:           pos,
		SubCellBase64: subCellBase64,
	}
}

type MultipleEvents struct {
	EventType EventType     `json:"eventType"`
	Events    []interface{} `json:"events"`
}

func NewMultipleEvents(events []interface{}) interface{} {
	return &MultipleEvents{EventType: MULTIPLE_EVENTS, Events: events}
}

type NpcTagetPositionEvent struct {
	EventType   EventType     `json:"eventType"`
	GridCellKey string        `json:"gridCellKey"`
	NpcUUID     string        `json:"npcUUID"`
	Pos         shared.Vector `json:"pos"`
}

func NewNpcTargetPositionEvent(gridCellKey string, npcUUID string, pos shared.Vector) NpcTagetPositionEvent {
	return NpcTagetPositionEvent{
		EventType:   NPC_TARGET_POSITION_EVENT,
		GridCellKey: gridCellKey,
		NpcUUID:     npcUUID,
		Pos:         pos,
	}
}

type UpdateNpcEvent struct {
	EventType   EventType        `json:"eventType"`
	GridCellKey string           `json:"gridCellKey"`
	NpcUUID     string           `json:"npcUUID"`
	Hitpoints   shared.Hitpoints `json:"hitpoints"`
	Remove      bool             `json:"remove"`
	Damage      int              `json:"damage"`
}

func NewUpdateNpcEvent(uuid string, currentHp int, maxHp int, remove bool, gridCellKey string, damage int) interface{} {
	hitpoints := shared.Hitpoints{Current: currentHp, Max: maxHp}
	return &UpdateNpcEvent{EventType: UPDATE_NPC_EVENT, NpcUUID: uuid, Remove: remove, Hitpoints: hitpoints, GridCellKey: gridCellKey, Damage: damage}
}

type UpdatePlayerEvent struct {
	EventType EventType        `json:"eventType"`
	PlayerId  int              `json:"playerId"`
	Hitpoints shared.Hitpoints `json:"hitpoints"`
	Damage    int              `json:"damage"`
	Heal      int              `json:"heal"`
	Crit      bool             `json:"crit"`
}

func NewUpdatePlayerEvent(playerId int, hitpoints shared.Hitpoints, damage int, heal int, crit bool) interface{} {
	return &UpdatePlayerEvent{EventType: UPDATE_PLAYER_EVENT, PlayerId: playerId, Hitpoints: hitpoints, Damage: damage, Heal: heal, Crit: crit}
}

type NpcAttackAnimEvent struct {
	EventType EventType `json:"eventType"`
	NpcUUID   string    `json:"npcUUID"`
	AttackID  int       `json:"attackID"`
}

func NewNpcAttackAnimEvent(npcUUID string, attackID int) interface{} {
	return &NpcAttackAnimEvent{EventType: NPC_ATTACK_ANIM_EVENT, NpcUUID: npcUUID, AttackID: attackID}
}

// Events send from client

type BaseEvent struct {
	EventType EventType       `json:"eventType"`
	Payload   json.RawMessage `json:"payload"`
}
type KeyBoardEvent struct {
	Key   string `json:"key"`
	Value int    `json:"value"`
}

type HitResourceEvent struct {
	Skill string `json:"skill"`
	Id    int    `json:"id"`
}

type HitNpcEvent struct {
	Skill string `json:"skill"`
	UUID  string `json:"uuid"`
}

type LootResourceEvent struct {
	Id int `json:"id"`
}

type PlayerPlacedResourceEvent struct {
	ResourceType string        `json:"resourceType"`
	Pos          shared.Vector `json:"pos"`
}

type LoginPlayerEvent struct {
	ResourceType string `json:"resourceType"`
	UUID         string `json:"uuid"`
}

type PlayerClickedItemEvent struct {
	UUID        string        `json:"uuid"`
	GridCellPos shared.Vector `json:"gridCellPos"`
}
