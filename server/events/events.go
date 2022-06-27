package events

import (
	"encoding/json"
	"ws-game/resource"
	"ws-game/shared"
)

type EventType int

const (
	NEW_USER_EVENT               EventType = 0
	ASSIGN_USER_ID_EVENT         EventType = 1
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
)

type NewPlayerEvent struct {
	EventType EventType     `json:"eventType"`
	Id        int           `json:"id"`
	Pos       shared.Vector `json:"pos"`
}

func GetNewPlayerEvent(id int, pos shared.Vector) interface{} {
	return &NewPlayerEvent{EventType: NEW_USER_EVENT, Id: id, Pos: pos}

	/* 	value, err := json.Marshal(u)

	   	if err != nil {
	   		fmt.Printf("Error: %s", err)
	   		return []byte{}
	   	} else {
	   		return value
	   	} */
}

type AssignUserIdEvent struct {
	EventType EventType     `json:"eventType"`
	Id        int           `json:"id"`
	Pos       shared.Vector `json:"pos"`
}

func GetAssignUserIdEvent(id int, pos shared.Vector) interface{} {
	return &AssignUserIdEvent{EventType: ASSIGN_USER_ID_EVENT, Id: id, Pos: pos}

	/* 	value, err := json.Marshal(u)

	   	if err != nil {
	   		fmt.Printf("Error: %s", err)
	   		return []byte{}
	   	} else {
	   		return value
	   	} */
}

type PlayerTargetPositionEvent struct {
	EventType EventType     `json:"eventType"`
	Id        int           `json:"id"`
	Pos       shared.Vector `json:"pos"`
}

func NewPlayerTargetPositionEvent(v shared.Vector, id int) interface{} {
	return &PlayerTargetPositionEvent{EventType: PLAYER_TARGET_POSITION_EVENT, Pos: v, Id: id}
	/*
		value, err := json.Marshal(u)

		if err != nil {
			fmt.Printf("Error: %s", err)
			return []byte{}
		} else {
			return value
		} */
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
	/*
		value, err := json.Marshal(u)

		if err != nil {
			fmt.Printf("Error: %s", err)
			return []byte{}
		} else {
			return value
		} */
}

type RemovePlayerEvent struct {
	EventType EventType `json:"eventType"`
	Id        int       `json:"id"`
}

func NewRemovePlayerEvent(id int) interface{} {
	return &RemovePlayerEvent{EventType: REMOVE_PLAYER_EVENT, Id: id}
	/*
		value, err := json.Marshal(u)

		if err != nil {
			fmt.Printf("Error: %s", err)
			return []byte{}
		} else {
			return value
		} */
}

type LoadInventoryEvent struct {
	EventType EventType                                   `json:"eventType"`
	Items     map[resource.ResourceType]resource.Resource `json:"items"`
}

func NewLoadInventoryEvent(inventory map[resource.ResourceType]resource.Resource) interface{} {
	return &LoadInventoryEvent{
		EventType: LOAD_INVENTORY_EVENT,
		Items:     inventory,
	}
	/*
		value, err := json.Marshal(event)

		if err != nil {
			fmt.Printf("Error: %s", err)
			return []byte{}
		} else {
			return value
		} */
}

type UpdateInventoryEvent struct {
	EventType EventType         `json:"eventType"`
	Item      resource.Resource `json:"item"`
	Remove    bool              `json:"remove"`
}

func NewUpdateInventoryEvent(r resource.Resource, remove bool) interface{} {
	return &UpdateInventoryEvent{
		EventType: UPDATE_INVENTORY_EVENT,
		Item:      r,
		Remove:    remove,
	}
	/*
		value, err := json.Marshal(event)

		if err != nil {
			fmt.Printf("Error: %s", err)
			return []byte{}
		} else {
			return value
		} */
}

type UpdateResourceEvent struct {
	EventType   EventType          `json:"eventType"`
	GridCellKey string             `json:"gridCellKey"`
	Id          int                `json:"id"`
	Hitpoints   resource.Hitpoints `json:"hitpoints"`
	Remove      bool               `json:"remove"`
}

func NewUpdateResourceEvent(id int, currentHp int, maxHp int, remove bool, gridCellKey string) interface{} {
	hitpoints := resource.Hitpoints{Current: currentHp, Max: maxHp}
	return &UpdateResourceEvent{EventType: UPDATE_RESOURCE_EVENT, Id: id, Remove: remove, Hitpoints: hitpoints, GridCellKey: gridCellKey}

	/* 	value, err := json.Marshal(u)

	   	if err != nil {
	   		fmt.Printf("Error: %s", err)
	   		return []byte{}
	   	} else {
	   		return value
	   	} */
}

type RemoveGridCellEvent struct {
	EventType   EventType `json:"eventType"`
	GridCellKey string    `json:"gridCellKey"`
}

func NewRemoveGridCellEvent(gridCellKey string) interface{} {
	return &RemoveGridCellEvent{EventType: REMOVE_GRID_CELL, GridCellKey: gridCellKey}
}

type MultipleEvents struct {
	EventType EventType     `json:"eventType"`
	Events    []interface{} `json:"events"`
}

func NewMultipleEvents(events []interface{}) interface{} {
	return &MultipleEvents{EventType: MULTIPLE_EVENTS, Events: events}
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

type LootResourceEvent struct {
	Id int `json:"id"`
}

type PlayerPlacedResourceEvent struct {
	ResourceType string        `json:"resourceType"`
	Pos          shared.Vector `json:"pos"`
}
