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
	UPDATE_PLAYER_VELOCITY_EVENT EventType = "UPDATE_PLAYER_VELOCITY_EVENT"
	RESOURCE_POSITIONS_EVENT     EventType = "RESOURCE_POSITIONS_EVENT"
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
		fmt.Println(err)
		return []byte{}
	} else {
		return value
	}
}

type UserMoveEvent struct {
	EventType EventType `json:"eventType"`
	x         int       `json:"x"`
	y         int       `json:"y"`
}

func GetUserMoveEvent(x int, y int) []byte {
	u := &UserMoveEvent{EventType: USER_MOVE_EVENT, x: x, y: y}

	value, err := json.Marshal(u)

	if err != nil {
		fmt.Println(err)
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
		fmt.Println(err)
		return []byte{}
	} else {
		return value
	}
}

type UpdatePlayerVelocityEvent struct {
	EventType EventType     `json:"eventType"`
	Id        int           `json:"id"`
	Velocity  shared.Vector `json:"velocity"`
}

func NewPlayerVelocityEvent(v shared.Vector, id int) []byte {
	u := &UpdatePlayerVelocityEvent{EventType: UPDATE_PLAYER_VELOCITY_EVENT, Velocity: v, Id: id}

	value, err := json.Marshal(u)

	if err != nil {
		fmt.Println(err)
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
		fmt.Println(err)
		return []byte{}
	} else {
		return value
	}
}

// read events from clients

type BaseEvent struct {
	EventType EventType       `json:"eventType"`
	Payload   json.RawMessage `json:"Payload"`
}

type KeyBoardEvent struct {
	Key   string `json:"key"`
	Value int    `json:"value"`
	Id    int    `json:"id"`
}
