package root

import (
	"ws-game/shared"

	"github.com/google/uuid"
)

type Npc struct {
	UUID            string        `json:"UUID"`
	Pos             shared.Vector `json:"pos"`
	Hp              float32       `json:"hp"`
	NpcType         string        `json:"npcType"`
	Aggressive      bool
	CritChance      float32
	MinDamage       float32
	MaxDamage       float32
	FollowingPlayer *Client
}

func NewNpc(pos shared.Vector) Npc {
	// simple test npc for ai implementation
	return Npc{
		UUID:            uuid.New().String(),
		Pos:             pos,
		Hp:              200.0,
		NpcType:         "",
		Aggressive:      false,
		MinDamage:       10,
		MaxDamage:       30,
		CritChance:      0.2,
		FollowingPlayer: nil,
	}
}
