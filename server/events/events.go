package events

import (
	"encoding/json"
	"fmt"
	"ws-game/shared"
)

const (
	NEW_USER_EVENT         = 0
	ASSIGN_USER_ID_EVENT   = 1
	USER_MOVE_EVENT        = 2
	KEYBOARD_EVENT         = 3
	UPDATE_PLAYER_VELOCITY = 4
)

type NewPlayerEvent struct {
	EventType int           `json:"eventType"`
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
	EventType int `json:"eventType"`
	x         int `json:"x"`
	y         int `json:"y"`
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
	EventType int `json:"eventType"`
	Id        int `json:"id"`
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
	EventType int           `json:"eventType"`
	Id        int           `json:"id"`
	Velocity  shared.Vector `json:"velocity"`
}

func NewPlayerVelocityEvent(v shared.Vector, id int) []byte {
	u := &UpdatePlayerVelocityEvent{EventType: UPDATE_PLAYER_VELOCITY, Velocity: v, Id: id}

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
	EventType int             `json:"eventType"`
	Payload   json.RawMessage `json:"Payload"`
}

type KeyBoardEvent struct {
	Key   string `json:"key"`
	Value int    `json:"value"`
	Id    int    `json:"id"`
}
