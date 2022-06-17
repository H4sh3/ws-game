package events

import (
	"encoding/json"
	"fmt"
	"ws-game/resource"
	"ws-game/shared"
)

type EventType string

const (
	NEW_USER_EVENT               EventType = "NEW_USER_EVENT"
	ASSIGN_USER_ID_EVENT         EventType = "ASSIGN_USER_ID_EVENT"
	USER_MOVE_EVENT              EventType = "USER_MOVE_EVENT"
	KEYBOARD_EVENT               EventType = "KEYBOARD_EVENT"
	PLAYER_TARGET_POSITION_EVENT EventType = "PLAYER_TARGET_POSITION_EVENT"
	RESOURCE_POSITIONS_EVENT     EventType = "RESOURCE_POSITIONS_EVENT"
	PLAYER_DISCONNECTED_EVENT    EventType = "PLAYER_DISCONNECTED_EVENT"
	HIT_RESOURCE_EVENT           EventType = "HIT_RESOURCE_EVENT"
	UPDATE_RESOURCE_EVENT        EventType = "UPDATE_RESOURCE_EVENT"
)

type NewPlayerEvent struct {
	EventType EventType     `json:"eventType"`
	Id        int           `json:"id"`
	Pos       shared.Vector `json:"pos"`
}

func GetNewPlayerEvent(id int, pos shared.Vector) []byte {
	u := &NewPlayerEvent{EventType: NEW_USER_EVENT, Id: id, Pos: pos}

	value, err := json.Marshal(u)

	if err != nil {
		fmt.Printf("Error: %s", err)
		return []byte{}
	} else {
		return value
	}
}

type AssignUserIdEvent struct {
	EventType EventType `json:"eventType"`
	Id        int       `json:"id"`
}

func GetAssignUserIdEvent(id int) []byte {
	u := &AssignUserIdEvent{EventType: ASSIGN_USER_ID_EVENT, Id: id}

	value, err := json.Marshal(u)

	if err != nil {
		fmt.Printf("Error: %s", err)
		return []byte{}
	} else {
		return value
	}
}

type PlayerTargetPositionEvent struct {
	EventType EventType     `json:"eventType"`
	Id        int           `json:"id"`
	Pos       shared.Vector `json:"pos"`
}

func NewPlayerTargetPositionEvent(v shared.Vector, id int) []byte {
	u := &PlayerTargetPositionEvent{EventType: PLAYER_TARGET_POSITION_EVENT, Pos: v, Id: id}

	value, err := json.Marshal(u)

	if err != nil {
		fmt.Printf("Error: %s", err)
		return []byte{}
	} else {
		return value
	}
}

type ResourcePositionsEvent struct {
	EventType EventType           `json:"eventType"`
	Resources []resource.Resource `json:"resources"`
}

func NewResourcePositionsEvent(resources []resource.Resource) []byte {
	u := &ResourcePositionsEvent{EventType: RESOURCE_POSITIONS_EVENT, Resources: resources}

	value, err := json.Marshal(u)

	if err != nil {
		fmt.Printf("Error: %s", err)
		return []byte{}
	} else {
		return value
	}
}

type PlayerDisconnectedEvent struct {
	EventType EventType `json:"eventType"`
	Id        int       `json:"id"`
}

func NewPlayerDisconnectedEvent(id int) []byte {
	u := &PlayerDisconnectedEvent{EventType: PLAYER_DISCONNECTED_EVENT, Id: id}

	value, err := json.Marshal(u)

	if err != nil {
		fmt.Printf("Error: %s", err)
		return []byte{}
	} else {
		return value
	}
}

type UpdateResourceEvent struct {
	EventType EventType          `json:"eventType"`
	Id        int                `json:"id"`
	Hitpoints resource.Hitpoints `json:"hitpoints"`
}

func NewUpdateResourceEvent(id int, currentHp int, maxHp int) []byte {
	u := &UpdateResourceEvent{EventType: UPDATE_RESOURCE_EVENT, Id: id, Hitpoints: resource.Hitpoints{Current: currentHp, Max: maxHp}}

	value, err := json.Marshal(u)

	if err != nil {
		fmt.Printf("Error: %s", err)
		return []byte{}
	} else {
		return value
	}
}

// read events from clients

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
